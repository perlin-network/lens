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
                data.endId,
                data.cameraSpeed
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

const addRound = (
    accepted,
    rejected,
    maxDepth,
    roundNum,
    startId,
    endId,
    cameraSpeed,
    forced = false
) => {
    let numTx = accepted + rejected;

    if ((!forced && rounds[roundNum]) || !numTx) {
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

        const node = {
            id, // generated as a per round id
            type,
            depth,
            position: getPos(depthIndex, depthWidth, globalDepth),
            round: roundNum,
            depthIndex, // every depth is an array, and depthIndex is the index within that
            parents: [],
            children: [],
            globalDepth,
            txId // start and end nodes receive id's from the server; use to access detail page on node click
        };

        round[depth] = round[depth] || [];
        round[depth][depthIndex] = node;

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

    const lastNode = createNode(numTx, "critical");

    nodes.push(lastNode);

    // we wait for all of the nodes to be positioned before we resolve node links
    const renderInfo = getRenderInfo(
        nodes,
        round,
        depthSize,
        maxDepth,
        cameraSpeed
    );

    startNode = lastNode;

    rounds[roundNum] = numTx + 1; // we added  extra start node

    postMessage(
        //  passing a stringified objects to web workers is considerably faster than JS objects
        JSON.stringify({
            type: "addRound",
            data: {
                roundNum,
                info: renderInfo
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
        const diffY = Math.abs(parent.position[0] - node.position[0]);
        const diffX = Math.abs(parent.position[1] - node.position[1]);
        const diff = (diffX + diffY) / 2;
        if (
            node.type === "critical" ||
            parent.type === "start" ||
            (!node.parents.filter(nonRejected).length && diff <= 2) ||
            (!parent.children.filter(nonRejected).length && diff <= 2)
        ) {
            return createLink(node, parent);
        }
    }
    return false;
};
const getPos = (index, width, globalDepth) => {
    const depthPos = [
        offset(index % width, width),
        offset(Math.floor(index / width), width)
    ];
    const posOffset = [randomRange(-30, 30) / 100, randomRange(-30, 30) / 100];

    const step = 0.8;
    return [
        step * depthPos[0] + posOffset[0],
        step * globalDepth - posOffset[0],
        step * depthPos[1] + posOffset[1]
    ];
};

const getRenderInfo = (nodes, round, depthSize, maxDepth, cameraSpeed) => {
    const addLineIndices = (node, parent) => {
        if (node.type === "rejected" || parent.type === "rejected") {
            dashIndices.push(parent.id);
            dashIndices.push(node.id);
        } else {
            lineIndices.push(parent.id);
            lineIndices.push(node.id);
        }
    };

    const positions = [];
    const sizes = [];
    const lineIndices = [];
    const dashIndices = [];
    const texIndices = [];
    const nodeInfo = [];
    const showTimes = [];

    let count = 0;

    const sizeMap = {
        start: 5,
        critical: 5,
        applied: 3,
        rejected: 3
    };
    const texIndicesMap = {
        start: 0,
        critical: 0,
        applied: 0,
        rejected: 1
    };

    nodes.forEach((node, i) => {
        const delay = ((node.depth + 2) / maxDepth) * cameraSpeed;
        showTimes.push(delay);

        nodeInfo.push({
            id: node.id,
            type: node.type,
            position: node.position,
            round: node.round
        });
        if (node.txId) {
            nodeInfo.txId = node.txId;
        }
        positions[count++] = node.position[0];
        positions[count++] = node.position[1];
        positions[count++] = node.position[2];

        sizes.push(sizeMap[node.type]);
        texIndices.push(
            node.type === "rejected"
                ? texIndicesMap.applied
                : texIndicesMap[node.type]
        );

        // above and beneath nodes are prefered for linking
        let parentIndex = node.depthIndex;
        let counter = 0;
        let level = 1;
        let inc = 1;
        const parentLimit = i % Math.floor(depthSize / 4) === 0 ? 3 : 1; // adds path forks

        if (node.type === "start") {
            return;
        }
        // all nodes (except rejected) next to critical should conenct to it
        if (node.type === "critical") {
            (round[node.depth - 1] || []).forEach(parent => {
                if (createLink(node, parent)) {
                    addLineIndices(node, parent);
                }
            });
            return;
        }

        // all nodes next to start node should connect to it
        if (node.depth === 0 && createLink(node, startNode)) {
            addLineIndices(node, startNode);
        }

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
                if (checkParent(node, parent)) {
                    addLineIndices(node, parent);
                }
            }

            if (node.type !== "rejected" && !node.children.length) {
                const child = (round[node.depth + level] || [])[circularIndex];
                if (checkParent(child, node)) {
                    addLineIndices(child, node);
                }
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

    return {
        positions,
        sizes,
        lineIndices,
        dashIndices,
        texIndices,
        showTimes,
        nodes: nodeInfo // trimmed down nodes list to improve WebWorker communication speed
    };
};

const createLink = (node, parent) => {
    // makes sure that an applied node doesn't have only rejected nodes as children
    if (
        node.type === "rejected" &&
        (parent.type === "applied" &&
            !parent.children.filter(nonRejected).length)
    ) {
        return false;
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
        return true;
    }
    return false;
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
