onmessage = evt => {
    const { type, ...data } = evt.data;
    switch (type) {
        case "addRound":
            addRound(
                data.accepted,
                data.rejected,
                data.maxDepth,
                data.roundNum
            );
            break;
        case "pruneRound":
            pruneRound(data.roundNum);
            break;
    }
};

const offset = (index, width) => index - Math.floor(width / 2);
const getPos = (index, width) => [
    offset(index % width, width),
    offset(Math.floor(index / width), width)
];

let lastCritical;
const rounds = {};

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

const addRound = (accepted, rejected, maxDepth, roundNum) => {
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
    const createNode = (index, type) => {
        // index - 1 we must omitt the start node
        let depthIndex = (index - 1) % depthSize;
        let depth = (index - 1) % maxDepth; // Math.floor((index - 1) / depthSize);

        if (type === "critical") {
            depth = maxDepth;
            depthIndex = Math.floor((depthSize - 1) / 2);
        }

        let globalDepth = depth;
        if (startNode) {
            globalDepth = startNode.globalDepth + depth + 1;
        }

        // for first startNode
        if (type === "start") {
            depthIndex = Math.floor(depthSize / 2);
            depth = -1;
            globalDepth = -1;
        }

        const depthWidth = Math.ceil(Math.sqrt(depthSize));
        const depthPos = getPos(depthIndex, depthWidth);

        const node = {
            id: index,
            type,
            depth,
            round: roundNum,
            globalDepth,
            depthPos,
            parents: [],
            children: []
        };

        nodes.push(node);

        round[depth] = round[depth] || [];
        round[depth][depthIndex] = node;

        if (node.type === "start") {
            return node;
        }

        const parentsLimit = randomRange(
            1,
            node.type === "critical" ? depthSize : 2
        );
        let parentIndex = depthIndex;

        const { random, extract } = uniqueRandomRange(0, depthSize);

        extract(parentIndex);

        if (node.type === "critical") {
            lastCritical = node;
        }

        while (node.parents.length < parentsLimit) {
            const parent1 = (round[depth - 1] || [])[parentIndex];
            const parent2 = (round[depth - 2] || [])[parentIndex];
            let parent;

            if (parent1 && parent1.type !== "rejected") {
                parent = parent1;
            } else if (parent2 && parent2.type !== "rejected") {
                parent = parent2;
            } else {
                parent = startNode;
            }

            if (parent) {
                if (
                    node.type === "critical" ||
                    parent.type === "critical" ||
                    !node.parents.length ||
                    parent.children.length < randomRange(0, 2)
                ) {
                    parent.children.push({
                        id: node.id,
                        type: node.type
                    });
                    node.parents.push({
                        id: parent.id,
                        type: node.type
                    });
                }
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
    postMessage(
        JSON.stringify({
            type: "pruneRound",
            data: roundNum
        })
    );
};
