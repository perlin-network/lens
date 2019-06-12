onmessage = evt => {
    const { type, ...data } = evt.data;
    switch (type) {
        case "addRound":
            addRound(
                data.accepted,
                data.rejected,
                data.maxDepth,
                data.roundNum,
                data.startId,
                data.endId
            );
            break;
        case "pruneRound":
            pruneRound(data.roundNum);
            break;
        case "destroy":
            destroy();
            break;
    }
};

const offset = (index, width) => index - Math.floor(width / 2);
const getPos = (index, width) => [
    offset(index % width, width),
    offset(Math.floor(index / width), width)
];
let rounds = {};

const randomRange = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const uniqueRandomRange = (min, max) => {
    if (min > max) {
        throw new Error(`Invalid random ranges ${min} - ${max}`);
    }
    const extracted = {};
    let extractedCount = 0;
    const info = {
        done: false,
        extracted
    };
    const random = (overrideMin = min, overrideMax = max) => {
        let value;

        while (!info.done) {
            value = randomRange(overrideMin, overrideMax);
            if (!extracted[value]) {
                extracted[value] = true;
                extractedCount++;
                break;
            }
        }

        info.done = extractedCount > max - min;
        // @ts-ignore
        return value;
    };

    const extract = value => {
        extracted[value] = true;
        extractedCount++;
    };

    return {
        random,
        info,
        extract
    };
};

/*
 *   startNode is the first node in the current round
 *   and the end (critical) node of the previous round
 */
let startNode;
const addRound = (accepted, rejected, maxDepth, roundNum, startId, endId) => {
    if (rounds[roundNum]) {
        return;
    }
    let numTx = accepted + rejected;
    const { random: uniqueRandom } = uniqueRandomRange(1, numTx);

    // depthSize represents the maximum number of nodes which can be on depth level
    const depthSize = Math.ceil(numTx / maxDepth);

    // random indices will be assigned rejected status
    const typeMap = {};
    let count = 0;

    while (count < rejected) {
        typeMap[uniqueRandom()] = "rejected";
        count++;
    }

    const round = {};
    const nodes = [];

    const checkParent = (node, parent) => {
        if (parent && node) {
            // diff of node positions assures that there a no cris-crossing links
            const diffY = Math.abs(parent.depthPos[0] - node.depthPos[0]);
            const diffX = Math.abs(parent.depthPos[1] - node.depthPos[1]);
            const diff = (diffX + diffY) / 2;
            if (
                node.type === "critical" ||
                parent.type === "start" ||
                (!node.parents.length && diff <= 1) ||
                (!parent.children.length && diff <= 1)
            ) {
                createLink(node, parent);
                return true;
            }
        }
        return false;
    };
    const createNode = (id, type) => {
        let txId;
        let index = id - 1;
        /*
        *   index = id - 1 we must omitt the startNode
        /*  In order for it (and its links) to be rendered it needs to be stored in the node array
        */
        let depth = index % maxDepth;
        let depthIndex;
        do {
            depthIndex = randomRange(0, depthSize - 1);
        } while (round[depth] && round[depth][depthIndex]);

        /*
         *  last node should be on it's one level except where the depthSize
         */
        if (type === "critical") {
            depth = depthSize === 1 ? maxDepth - 1 : maxDepth;
            txId = endId;
        }

        //  globalDepth is use to vertically position the nodes within the global viewport
        let globalDepth = depth;
        if (startNode) {
            globalDepth = startNode.globalDepth + depth + 1;
        }

        // startNode will overlap previous round critical node
        if (type === "start") {
            depth = -1;
            globalDepth = -1;
            txId = startId;
        }

        // depthWidth reprezents the dimention of matrix structure for each level
        const depthWidth = Math.ceil(Math.sqrt(depthSize));
        const depthPos = getPos(depthIndex, depthWidth);

        const node = {
            id,
            type,
            depth,
            round: roundNum,
            globalDepth,
            depthPos,
            depthIndex,
            parents: [],
            children: [],
            applied: false,
            txId,
            posOffset: randomRange(-30, 30) / 100 // add random position offsets to avoid link overlapping
        };

        round[depth] = round[depth] || [];
        round[depth][depthIndex] = node;

        if (node.type === "start") {
            return node;
        }

        if (node.depth === 0) {
            createLink(node, startNode);
            return node;
        }

        if (node.type === "critical") {
            (round[depth - 1] || []).forEach(parent =>
                createLink(node, parent)
            );
        }

        return node;
    };

    let index = 0;

    if (startNode) {
        startNode = {
            ...startNode,
            parents: [],
            id: index,
            type: "start",
            depth: -1
        };
    } else {
        startNode = createNode(index, "start");
    }
    nodes.push(startNode);

    while (++index < numTx) {
        const node = createNode(index, typeMap[index] || "accepted");
        nodes.push(node);
    }

    const node = createNode(numTx, "critical");
    startNode = node;
    nodes.push(node);

    // we wait for all of the nodes to be positioned before we start linking them
    nodes.forEach(node => {
        if (node.type === "critical" || node.type === "start") {
            return;
        }

        // above and beneath nodes are prefered for linking
        let parentIndex = node.depthIndex;
        let counter = 0;
        let level = 1;
        let inc = 1;
        const parentLimit = randomRange(1, 2);

        while (
            counter < depthSize &&
            (round[node.depth - level] || round[node.depth + level])
        ) {
            /*
             *   starts with possible node located above or bellow the current one
             *   and goes round the depth matrices to check for posible parent and/or child nodes
             */
            const circularIndex = Math.abs(parentIndex % depthSize);

            if (node.parents.length < parentLimit) {
                const parent = (round[node.depth - level] || [])[circularIndex];
                checkParent(node, parent);
            }

            if (!node.children.length) {
                const child = (round[node.depth + level] || [])[circularIndex];
                checkParent(child, node);
            }

            if (node.parents.length >= parentLimit && node.children.length) {
                break;
            }

            parentIndex += inc;
            counter++;

            if (parentIndex < 0 && level <= 2) {
                level++;

                // we alternate the increment direction so that there a diagonal links on both directions
                inc = level % 2 === 0 ? -1 : 1;
                counter = 0;
                parentIndex = node.depthIndex;
            }
        }
    });

    let lastVisit = startNode;
    // starting from critical node we go through all first parents to apply nodes
    const visit = (node, level = 0) => {
        // we needed to avoid breaching the call stack limit
        if (level > 1000) {
            return node;
        }
        if (!node) {
            return;
        }
        node.type = node.type === "accepted" ? "applied" : node.type;

        const parent = node.parents[node.parents.length - 1];
        if (parent && parent.type !== "start") {
            parent.type = parent.type === "accepted" ? "applied" : parent.type;
            visit(nodes[parent.id], level + 1);
        }
    };

    do {
        lastVisit = visit(lastVisit);
    } while (lastVisit);

    rounds[roundNum] = numTx + 1;

    postMessage(
        //  passing a stringified objects to web workers is considerably faster than JS objects
        JSON.stringify({
            type: "addRound",
            data: {
                roundNum,
                nodes
            }
        })
    );
};

const createLink = (node, parent) => {
    if (parent.type !== "rejected") {
        parent.children.push({
            id: node.id,
            type: node.type
        });
        node.parents.push({
            id: parent.id,
            type: parent.type
        });
    }
};

const pruneRound = (roundNum, numTx) => {
    if (typeof rounds[roundNum] === "undefined") {
        // we mark the round as pruned and skip it in case addRound is somehow called after
        rounds[roundNum] = -1;
    }

    delete rounds[roundNum];

    postMessage(
        JSON.stringify({
            type: "pruneRound",
            data: roundNum
        })
    );
};

const destroy = () => {
    rounds = {};
};
