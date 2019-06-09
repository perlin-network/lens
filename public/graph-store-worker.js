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

let lastCritical;
let rounds = {};

const randomRange = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
// @ts-ignore
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
let startNode;
const addRound = (accepted, rejected, maxDepth, roundNum, startId, endId) => {
    if (rounds[roundNum]) {
        return;
    }
    let numTx = accepted + rejected;
    const { random: uniqueRandom } = uniqueRandomRange(1, numTx);

    const depthSize = Math.ceil(numTx / maxDepth);
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
            }
            return true;
        }
        return false;
    };
    const createNode = (id, type) => {
        let txId;
        let index = id - 1;
        // index - 1 we must omitt the start node
        let depth = index % maxDepth; // Math.floor((index - 1) / depthSize);
        let depthIndex;
        do {
            depthIndex = randomRange(0, depthSize - 1);
        } while (round[depth] && round[depth][depthIndex]);

        if (type === "critical") {
            depth = depthSize === 1 ? maxDepth - 1 : maxDepth;
            txId = endId;
        }

        let globalDepth = depth;
        if (startNode) {
            globalDepth = startNode.globalDepth + depth + 1;
        }

        // for first startNode
        if (type === "start") {
            depth = -1;
            globalDepth = -1;
            txId = startId;
        }

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
            txId,
            posOffset: randomRange(-15, 15) / 100
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
            startNode = node;
            (round[depth - 1] || []).forEach(parent =>
                createLink(node, parent)
            );
            // return node;
        }

        return node;
    };

    let index = 0;

    if (startNode) {
        startNode = {
            ...startNode,
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
    nodes.push(node);

    nodes.forEach(node => {
        let parentIndex = node.depthIndex;
        let level = 1;
        let inc = -1;
        const parentLimit = randomRange(1, 3);
        while (parentIndex >= 0 && parentIndex < depthSize) {
            const parent1 = (round[node.depth - level] || [])[parentIndex];
            const parent2 = (round[node.depth + level] || [])[parentIndex];

            if (!checkParent(node, parent1)) {
                checkParent(parent2, node);
            }

            if (node.parents.length >= parentLimit) {
                return;
            }
            parentIndex -= inc;

            if (parentIndex < 0 && level <= 4) {
                level++;
                inc = level % 2 === 0 ? -1 : 1;
                parentIndex = node.depthIndex;
            }
        }
    });
    rounds[roundNum] = numTx + 1;

    postMessage(
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
    lastCritical = undefined;
};
