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
const getPos = (index, width) => [index % width, Math.floor(index / width)];

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

    return {
        random,
        info
    };
};

const addNode = (id, depth, depthPos, type, round, globalDepth) => {
    const node = {
        id,
        type,
        depth,
        round,
        globalDepth,
        depthPos,
        parents: [],
        children: []
    };

    return node;
};

const addRound = (accepted, rejected, maxDepth, roundNum) => {
    if (rounds[roundNum]) {
        return;
    }
    const numTx = accepted + rejected - 1;
    const { random: uniqueRandom } = uniqueRandomRange(0, numTx - 1);

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
        let depthIndex = index % depthSize;

        let depth = index % maxDepth; // Math.floor(index / depthSize);

        if (type === "critical") {
            depth = depthSize > 1 ? maxDepth : maxDepth - 1;
            depthIndex = 0;
        }

        let lastCriticalDepth = 0;
        if (lastCritical) {
            lastCriticalDepth += lastCritical.globalDepth + 1;
        }
        const globalDepth = lastCriticalDepth + depth;

        const depthPos = getPos(depthIndex, Math.ceil(Math.sqrt(depthSize)));

        const node = addNode(
            index,
            depth,
            depthPos,
            type,
            roundNum,
            globalDepth
        );

        nodes.push(node);

        round[depth] = round[depth] || [];
        round[depth][depthIndex] = node;

        if (lastCritical && depth === 0) {
            node.parents.push({
                id: lastCritical.id,
                type: lastCritical.type
            });
            lastCritical.children.push({
                id: node.id,
                type: node.type
            });
        }

        const parentsLimit = node.type === "critical" ? depthSize : 2;
        let parentIndex = depthIndex;

        const { random } = uniqueRandomRange(0, depthSize);

        if (node.type === "critical") {
            lastCritical = node;
        }

        while (node.parents.length < parentsLimit) {
            const parent =
                (round[depth - 1] || [])[parentIndex] ||
                (round[depth - 2] || [])[parentIndex];

            if (parent && parent.type !== "rejected") {
                if (
                    node.type === "critical" ||
                    parent.type === "critical" ||
                    !node.parents.length
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

    for (let index = 0; index < numTx; index++) {
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
