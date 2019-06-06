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
            info.done = extractedCount > max - min;
        }

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

const addRound = (accepted, rejected, maxDepth, roundNum, startId, endId) => {
    let numTx = accepted + rejected;

    if (rounds[roundNum] || !numTx) {
        return;
    }
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

    const createNode = (index, type) => {
        let txId;
        // index - 1 we must omitt the start node
        let depth = (index - 1) % maxDepth; // Math.floor((index - 1) / depthSize);
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
            id: index,
            type,
            depth,
            round: roundNum,
            globalDepth,
            depthIndex,
            depthPos,
            parents: [],
            children: [],
            txId,
            posOffset: randomRange(-15, 15) / 100
        };

        nodes.push(node);

        round[depth] = round[depth] || [];
        round[depth][depthIndex] = node;

        return node;
    };

    const createLinks = node => {
        const parentsLimit =
            node.type === "critical" ? depthSize : randomRange(1, 2);
        let parentIndex = node.depthIndex;

        const checkParent = (node, parent) => {
            if (parent && parent.type !== "rejected") {
                const diffX = Math.abs(node.depthPos[0] - parent.depthPos[0]);
                const diffY = Math.abs(node.depthPos[1] - parent.depthPos[1]);
                const diff = (diffX + diffY) / 2;

                if (
                    node.type === "critical" ||
                    parent.type === "start" ||
                    !node.parents.length ||
                    (!parent.children.length &&
                        diff <= 0.5 &&
                        node.parents.length <= parentsLimit)
                ) {
                    parent.children.push({
                        id: node.id,
                        type: node.type
                    });
                    node.parents.push({
                        id: parent.id,
                        type: node.type
                    });
                    return true;
                }
            }
            return false;
        };
        const { random, extract, info } = uniqueRandomRange(0, depthSize - 1);

        extract(parentIndex);

        if (node.type === "critical") {
            lastCritical = node;
        }

        while (node.parents.length <= parentsLimit) {
            const parent1 = (round[node.depth - 1] || [])[parentIndex];
            const parent2 = (round[node.depth - 2] || [])[parentIndex];

            if (!checkParent(node, parent1)) {
                checkParent(node, parent2);
            }

            if (node.depth === 0) {
                checkParent(node, startNode);
            }

            parentIndex = random();

            if (typeof parentIndex === "undefined") {
                break;
            }
        }
    };

    let startNode;
    let index = 0;

    if (lastCritical) {
        startNode = {
            ...lastCritical,
            id: index,
            type: "start",
            depth: -1
        };
        nodes.push(startNode);
    } else {
        startNode = createNode(index, "start");
    }

    while (++index < numTx) {
        createNode(index, typeMap[index] || "accepted");
    }

    createNode(numTx, "critical");

    nodes.forEach(createLinks);

    rounds[roundNum] = numTx + 1;

    postMessage({
        type: "addRound",
        data: {
            roundNum,
            nodes
        }
    });
};

const resetNodeIds = () => {
    let counter = 0;
    nodes.forEach(node => (node.id = counter++));
};

const pruneRound = (roundNum, numTx) => {
    if (typeof rounds[roundNum] === "undefined") {
        rounds[roundNum] = -1;
    }

    // numTx = rounds[roundNum];

    delete rounds[roundNum];
    // nodes.splice(0, numTx);
    postMessage({
        type: "pruneRound",
        data: roundNum
    });
};

const destroy = () => {
    rounds = {};
    lastCritical = undefined;
};
