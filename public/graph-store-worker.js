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
const nonRejected = node => node.type !== "rejected";
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
    let numTx = accepted + rejected;

    if (rounds[roundNum] || !numTx) {
        return;
    }

    // depthSize represents the maximum number of nodes which can be on depth level
    const depthSize = Math.ceil(numTx / maxDepth);

    // random indices will be assigned rejected status
    const nodeMap = getRejectedIndices(accepted, rejected, depthSize);

    const round = {}; // will be a nodes per level structure, needed for node link resolve
    const nodes = [];

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
            id, // generated as a per round id
            type,
            depth,
            round: roundNum,
            globalDepth, // needed to determine vertical coordinate
            depthPos, // will be used to multiple a given step value to determine horizontal coordinates
            depthIndex, // every depth is an array, and depthIndex is the index within that
            parents: [],
            children: [],
            txId, // start and end nodes receive id's from the server; use to access detail page on node click
            posOffset: [randomRange(-30, 30) / 100, randomRange(-30, 30) / 100] // add random position offsets to avoid link overlapping
        };

        round[depth] = round[depth] || [];
        round[depth][depthIndex] = node;

        if (node.type === "start") {
            return node;
        }

        // all nodes next to start node should connect to it
        if (node.depth === 0) {
            createLink(node, startNode);
            return node;
        }

        // all nodes (except rejected) next to critical should conenct to it
        if (node.type === "critical") {
            (round[depth - 1] || []).forEach(parent =>
                createLink(node, parent)
            );
        }

        return node;
    };

    let index = 0;

    // will create a clone of the last rounds' critical node and call it start node
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
        const node = createNode(index, nodeMap[index] || "applied");
        nodes.push(node);
    }

    const node = createNode(numTx, "critical");
    startNode = node;
    nodes.push(node);

    // we wait for all of the nodes to be positioned before we resolve node links
    resolveNodeLinks(nodes, round, depthSize);

    rounds[roundNum] = numTx + 1; // we added  extra start node

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

const getRejectedIndices = (accepted, rejected, depthSize) => {
    const nodeMap = {};
    let addCount = 0;
    let depthCount = 0;

    const { random: uniqueRandom, extract, info } = uniqueRandomRange(
        1, // skip 0 as it's start node
        accepted - 1
    );

    let startIndex = uniqueRandom();

    // creates a vertically districbuted set of rejected node indices
    while (addCount < rejected && !info.done) {
        const i = startIndex + depthCount * depthSize;

        if (i < accepted + rejected) {
            nodeMap[i] = "rejected";
            extract(i); // uniqueRandom shouldn't extract this index anymore
            addCount++;

            depthCount += depthSize;
        } else {
            startIndex = uniqueRandom();
            depthCount = 0;
        }
    }

    return nodeMap;
};

const checkParent = (node, parent) => {
    if (parent && node) {
        // diff of node positions assures that there a no cris-crossing links
        const diffY = Math.abs(parent.depthPos[0] - node.depthPos[0]);
        const diffX = Math.abs(parent.depthPos[1] - node.depthPos[1]);
        const diff = (diffX + diffY) / 2;
        if (
            node.type === "critical" ||
            parent.type === "start" ||
            (!node.parents.filter(nonRejected).length && diff <= 1) ||
            (!parent.children.filter(nonRejected).length && diff <= 1)
        ) {
            createLink(node, parent);
            return true;
        }
    }
    return false;
};

const resolveNodeLinks = (nodes, round, depthSize) => {
    nodes.forEach((node, i) => {
        // above and beneath nodes are prefered for linking
        let parentIndex = node.depthIndex;
        let counter = 0;
        let level = 1;
        let inc = 1;
        const parentLimit = i % Math.floor(depthSize / 4) === 0 ? 3 : 1; // adds path forks

        while (
            counter <= depthSize &&
            (round[node.depth - level] || round[node.depth + level])
        ) {
            if (node.type === "start") {
                return;
            }
            /*
             *   starts with possible node located above or bellow the current one
             *   and goes round the depth matrices to check for posible parent and/or child nodes
             */
            const circularIndex = Math.abs(parentIndex % depthSize);

            if (node.parents.length < 3) {
                const parent = (round[node.depth - level] || [])[circularIndex];
                checkParent(node, parent);
            }

            if (node.type !== "rejected" && !node.children.length) {
                const child = (round[node.depth + level] || [])[circularIndex];
                checkParent(child, node);
            }

            if (
                node.parents.length >= parentLimit &&
                (node.type !== "rejected" && node.children.length)
            ) {
                break;
            }

            parentIndex += inc;
            counter++;

            if (counter > depthSize && level <= 2) {
                level++;

                // we alternate the increment direction so that there a diagonal links on both directions
                inc = level % 2 === 0 ? -1 : 1;
                counter = 0;
                parentIndex = node.depthIndex;
            }
        }
    });
};

const createLink = (node, parent) => {
    // makes sure that an applied node doesn't have only rejected nodes as children
    if (
        node.type === "rejected" &&
        (parent.type === "applied" &&
            !parent.children.filter(nonRejected).length)
    ) {
        return;
    }

    // rejected nodes should be able to have other rejected nodes as children
    if (parent.type !== "rejected" || node.type === "rejected") {
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

const pruneRound = roundNum => {
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
