import ReactDOM from 'react-dom'
import React, { useState, useEffect } from 'react'
import { Process, System } from './System'

import './index.scss'

const defaultResources = [2, 3, 2]
const defaultProcesses = [
    { name: 'P1', allocations: [2, 1, 2], needs: [3, 4, 7], isFinish: false },
    { name: 'P2', allocations: [4, 0, 2], needs: [1, 3, 4], isFinish: false },
    { name: 'P3', allocations: [4, 0, 5], needs: [0, 0, 6], isFinish: false },
    { name: 'P4', allocations: [2, 0, 4], needs: [2, 2, 1], isFinish: false },
    { name: 'P5', allocations: [3, 1, 4], needs: [1, 1, 0], isFinish: false },
]

enum InputGroupType {
    Available,
    Allocation,
    Need
}

function App() {
    const [resources, setResources] = useState(defaultResources)
    const [processes, setProcesses] = useState(defaultProcesses)
    const [preValues, setPreValues] = useState(new Map())

    const toFlexAround = (type: InputGroupType, row: number, arr: number[]) => {
        return arr.map((num, index) => (
            <input
                type='number'
                min='0'
                max='99'
                className='hidden-input'
                defaultValue={num}
                id={`${ type }-${ row }-${ index }`}
                key={index}
                onFocus={onInputFocus}
                onChange={onInputChange}
            ></input>
        ))
    }

    useEffect(() => {
        System.setProcesses(processes).setAvailableResources(resources)
    }, [resources, processes])

    const createEmptyProcess = (index: number, resourceCategories: number) => ({
        name: `P${ index }`,
        allocations: Array.from({ length: resourceCategories }, () => 0),
        needs: Array.from({ length: resourceCategories }, () => 0),
        isFinish: false
    } as Process)

    const onInputFocus = ev => {
        const element = ev.target

        element.select()
        preValues.set(element, element.value)
    }
    const onInputChange = ev => {
        const element = ev.target
        const diff = element.value - preValues.get(element)

        switch (element.id) {
            case 'processes': {
                if (diff >= 0) {
                    const diffs = Array.from({ length: diff }, () => createEmptyProcess(parseInt(element.value), resources.length))
                    setProcesses([...processes, ...diffs])
                } else {
                    setProcesses(processes.slice(0, parseInt(element.value)))
                }
                break
            }
            case 'resources': {
                const toBeUpdatedProcs = [...processes]
                const toBeUpdatedRes = [...resources]
                const diffs = Array.from({ length: diff }, () => 0)

                for (const [i, { allocations, needs }] of processes.entries()) {
                    if (diff >= 0) {
                        toBeUpdatedProcs[i].allocations = [...allocations, ...diffs]
                        toBeUpdatedProcs[i].needs = [...needs, ...diffs]
                    } else {
                        toBeUpdatedProcs[i].allocations = allocations.slice(0, parseInt(element.value))
                        toBeUpdatedProcs[i].needs = needs.slice(0, parseInt(element.value))
                    }
                }

                if (diff >= 0) {
                    toBeUpdatedRes.push(...diffs)
                } else {
                    const index = parseInt(element.value)
                    toBeUpdatedRes.splice(index, toBeUpdatedRes.length - index + 1)
                }

                setProcesses(toBeUpdatedProcs)
                setResources(toBeUpdatedRes)
                break
            }
            default: {
                const [type, row, index] = element.id.split('-')
                switch (parseInt(type)) {
                    case InputGroupType.Available: {
                        const toBeUpdatedRes = [...resources]
                        toBeUpdatedRes[index] = parseInt(element.value)
                        setResources(toBeUpdatedRes)
                        break
                    }
                    case InputGroupType.Allocation: {
                        const toBeUpdatedProcs = [...processes]
                        toBeUpdatedProcs[row].allocations[index] = parseInt(element.value)
                        setProcesses(toBeUpdatedProcs)
                        break
                    }
                    case InputGroupType.Need: {
                        const toBeUpdatedProcs = [...processes]
                        toBeUpdatedProcs[row].needs[index] = parseInt(element.value)
                        setProcesses(toBeUpdatedProcs)
                    }
                }
            }
        }

        preValues.set(element, element.value)
    }

    return (
        <>
            <div className='main'>
                <div className='title'>银行家算法模拟器</div>
                <table>
                    <tbody>
                        <tr>
                            <td>系统进程数 (Processes)</td>
                            <td>系统资源种类数 (Resources Categories)</td>
                            <td>系统剩余资源数 (Available)</td>
                        </tr>
                        <tr>
                            <td><input
                                type='number'
                                min='0'
                                max='99'
                                id='processes'
                                className='hidden-input'
                                defaultValue={processes.length}
                                onFocus={onInputFocus}
                                onChange={onInputChange}
                            >
                            </input></td>
                            <td><input
                                type='number'
                                min='0'
                                max='5'
                                id='resources'
                                className='hidden-input'
                                defaultValue={resources.length}
                                onFocus={onInputFocus}
                                onChange={onInputChange}
                            >
                            </input></td>
                            <td className='flex-around'>{toFlexAround(InputGroupType.Available, 0, resources)}</td>
                        </tr>
                    </tbody>
                </table>
                <table>
                    <tbody>
                        <tr>
                            <td>进程名 (Process)</td>
                            <td>已分配资源数 (Allocation)</td>
                            <td>仍需要资源数 (Need)</td>
                            <td>进程状态 (Finish)</td>
                            <td>工作向量 (Work)</td>
                        </tr>
                        {
                            processes.map(({ name, allocations, needs, isFinish }, index) => (
                                <tr key={index}>
                                    <td><input className='hidden-input' defaultValue={name}></input></td>
                                    <td className='flex-around'>{toFlexAround(InputGroupType.Allocation, index, allocations)}</td>
                                    <td className='flex-around'>{toFlexAround(InputGroupType.Need, index, needs)}</td>
                                    <td
                                        style={{ color: isFinish ? 'red' : 'green' }}
                                    >{isFinish ? '已完成' : '运行中'}</td>
                                    <td></td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
                <div className='panel'>
                    <div className='left'>
                        <button>检查系统安全性</button>
                    </div>
                    <div className='right'>
                        <span>尝试为进程分配资源：</span>
                        <select>
                            {processes.map(({ name }, index) => <option key={index}>{name}</option>)}
                        </select>
                        {resources.map((_, index) => (
                            <input
                                key={index}
                                type='number'
                                min='0'
                                max='99'
                                defaultValue='0'
                                onFocus={onInputFocus}
                            ></input>
                        ))}
                        <button>申请资源</button>
                    </div>
                </div>
            </div>
        </>
    )
}

ReactDOM.render(
    <App />,
    document.getElementById('root')
)