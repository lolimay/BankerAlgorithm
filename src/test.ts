import { System } from './System'

function it(description: string, fn: (...args: any[]) => void): void {
    return fn()
}

function assert(expr: unknown): asserts expr {
    if (!expr) {
        throw new Error('Test Failed')
    }
}

it('安全判定算法 OK', () => {
    const isSafe = System
        .setAvailableResources([3, 3, 2])
        .setProcesses([
            { name: 'P0', allocations: [0, 1, 0], needs: [7, 4, 3], isFinish: false },
            { name: 'P1', allocations: [2, 0, 0], needs: [1, 2, 2], isFinish: false },
            { name: 'P2', allocations: [3, 0, 2], needs: [6, 0, 0], isFinish: false },
            { name: 'P3', allocations: [2, 1, 1], needs: [0, 1, 1], isFinish: false },
            { name: 'P4', allocations: [0, 0, 2], needs: [4, 3, 1], isFinish: false },
        ])
        .isSafe()

    assert(isSafe)
})

it('资源分配算法 OK', () => {
    const system = System
        .setAvailableResources([2, 3, 3])
        .setProcesses([
            { name: 'P1', allocations: [2, 1, 2], needs: [3, 4, 7], isFinish: false },
            { name: 'P2', allocations: [4, 0, 2], needs: [1, 3, 4], isFinish: false },
            { name: 'P3', allocations: [4, 0, 5], needs: [0, 0, 6], isFinish: false },
            { name: 'P4', allocations: [2, 0, 4], needs: [2, 2, 1], isFinish: false },
            { name: 'P5', allocations: [3, 1, 4], needs: [1, 1, 0], isFinish: false },
        ])

    assert(system.isSafe())
    assert(system.assignResources('P2', [0, 3, 4]) === false)
    assert(system.assignResources('P4', [2, 0, 1]))
})