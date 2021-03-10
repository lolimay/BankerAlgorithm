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
        .setAvailableResources([17, 5, 20])
        .setProcesses([
            { name: 'P1', allocations: [2, 1, 2], needs: [5, 5, 9], isFinish: false },
            { name: 'P2', allocations: [4, 0, 2], needs: [5, 3, 6], isFinish: false },
            { name: 'P3', allocations: [4, 0, 5], needs: [4, 0, 11], isFinish: false },
            { name: 'P4', allocations: [2, 0, 4], needs: [4, 2, 5], isFinish: false },
            { name: 'P5', allocations: [3, 1, 4], needs: [4, 2, 4], isFinish: false },
        ])

    assert(system.isSafe())

    const canAssignResources = system.assignResources('P2', [0, 3, 4])
    assert(canAssignResources)
})