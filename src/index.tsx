import ReactDOM from 'react-dom'
import React, { useState, useEffect, useRef } from 'react'
import { Process, System, SystemEventType } from './System'

import './index.scss'
import { clone } from './util'

export const getFormattedTime = () => {
    return new Date().toLocaleString('zh-Hans-CN', { hour12: false })
}

const defaultResources = [3, 3, 2]
const defaultProcesses = [
    { name: 'P0', allocations: [0, 1, 0], needs: [7, 4, 3], isFinish: false },
    { name: 'P1', allocations: [2, 0, 0], needs: [1, 2, 2], isFinish: false },
    { name: 'P2', allocations: [3, 0, 2], needs: [6, 0, 0], isFinish: false },
    { name: 'P3', allocations: [2, 1, 1], needs: [0, 1, 1], isFinish: false },
    { name: 'P4', allocations: [0, 0, 2], needs: [4, 3, 1], isFinish: false },
]

enum InputGroupType {
    Available,
    Allocation,
    Need
}

enum LogLevel {
    Error = '#eb4129',
    Warn = 'yellow',
    Info = 'white',
    Success = '#abe047'
}

interface Log {
    level: LogLevel
    content: string
}

function App() {
    const [resources, setResources] = useState(defaultResources)
    const [processes, setProcesses] = useState(defaultProcesses)
    const [preValues, setPreValues] = useState(new Map())
    const [readOnly, setReadOnly] = useState(false)
    const [workInfo, setWorkInfo] = useState({})
    const [logs, setLogs] = useState([{ level: LogLevel.Info, content: '点击按钮开始进行安全性检查' } as Log])
    const backup = useRef({})
    const resourcesInputs = useRef()

    const toFlexAround = (type: InputGroupType, row: number, arr: number[]) => {
        const shouldHighlight = (row: number, index: number, num: number): string => {
            if (type === InputGroupType.Need && workInfo?.id === row) {
                if (workInfo.work[index] >= num) {
                    return 'green'
                } else {
                    return 'red'
                }
            }
            return ''
        }

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
                disabled={readOnly}
                style={{
                    color: shouldHighlight(row, index, num),
                    fontWeight: shouldHighlight(row, index, num) ? 'bold' : ''
                }}
            ></input>
        ))
    }

    const handleSystemEvents = async (toBeUpdatedLogs: Log[]) => {
        for (const event of System.events) {
            console.log(event)
            switch (event.type) {
                case SystemEventType.MOVE_WORKVEC: {
                    setWorkInfo(event.payload)
                    break
                }
                case SystemEventType.PROCESS_FINISH: {
                    const toBeUpdatedProcs = [...processes]
                    toBeUpdatedProcs[event.payload].isFinish = true
                    setProcesses(toBeUpdatedProcs)
                    break
                }
                case SystemEventType.SEQ_FOUND: {
                    toBeUpdatedLogs.push({
                        level: LogLevel.Warn,
                        content: `找到安全序列： ${ event.payload }，当前时刻系统安全！`
                    })
                    setLogs(toBeUpdatedLogs)
                    break
                }
                case SystemEventType.SEQ_NOT_FOUND: {
                    toBeUpdatedLogs.push({
                        level: LogLevel.Error,
                        content: `未找到安全序列，当前时刻系统不安全！`
                    })
                    setLogs(toBeUpdatedLogs)
                    break
                }
                case SystemEventType.CHECK_SAFETY_END: {
                    setProcesses(backup.current.processes)
                    setResources(backup.current.resources)
                    setWorkInfo({})
                    setReadOnly(false)
                    break
                }
                case SystemEventType.ASSIGN_RESOURCES_START: {
                    toBeUpdatedLogs.push({
                        level: LogLevel.Info,
                        content: `开始尝试为进程 ${ event.payload } 分配系统资源...`
                    })
                    setLogs(toBeUpdatedLogs)
                    break
                }
                case SystemEventType.ASSIGN_RESOURCES_MEET_NEEDS: {
                    const log = {
                        level: LogLevel.Success,
                        content: '待申请的资源满足该进程实际需要✓'
                    }
                    if (!event.payload) {
                        const logs = [...toBeUpdatedLogs, {
                            level: LogLevel.Error,
                            content: '待申请的资源大于该进程实际需要，资源分配失败！'
                        }]
                        setLogs(logs)
                        break
                    }
                    toBeUpdatedLogs.push(log)
                    setLogs(toBeUpdatedLogs)
                    break
                }
                case SystemEventType.ASSIGN_RESOURCES_MEET_SYSTEM: {
                    const log = {
                        level: LogLevel.Success,
                        content: '系统当前剩余资源满足此次申请✓'
                    }
                    if (!event.payload) {
                        const logs = [...toBeUpdatedLogs, {
                            level: LogLevel.Error,
                            content: '系统当前剩余资源不满足此次申请，资源分配失败！'
                        }]
                        setLogs(logs)
                        break
                    }
                    toBeUpdatedLogs.push(log)
                    setLogs(toBeUpdatedLogs)
                    break
                }
                case SystemEventType.PRE_ASSIGN_RESOURCES: {
                    const logs = [...toBeUpdatedLogs, {
                        level: LogLevel.Info,
                        content: '尝试分配资源并调用系统安全性算法检测系统安全性...'
                    }]
                    setLogs(logs)
                    const { requests, id } = event.payload
                    const toBeUpdatedProcs = clone(processes)
                    const toBeUpdatedRes = clone(resources)

                    console.log(requests, id)
                    requests.forEach((request, i) => {
                        toBeUpdatedRes[i] -= request
                        toBeUpdatedProcs[id].allocations[i] += request
                        toBeUpdatedProcs[id].needs[i] -= request
                    })

                    console.log(toBeUpdatedProcs, toBeUpdatedRes)
                    setProcesses(toBeUpdatedProcs)
                    setResources(toBeUpdatedRes)
                    break
                }
            }

            await new Promise(resume => setTimeout(resume, 2000))
        }
    }

    const performBackup = () => {
        Object.assign(backup.current, {
            resources: clone(resources),
            processes: clone(processes)
        })
        return setReadOnly(true)
    }

    const checkSystemSafety = async () => {
        const toBeUpdatedLogs = [...logs]

        performBackup()
        toBeUpdatedLogs.push({ level: LogLevel.Info, content: '开始检查系统安全性...' })
        setLogs(toBeUpdatedLogs)

        System.clearEvents().isSafe()

        await handleSystemEvents(toBeUpdatedLogs)
    }

    const allocateResource = async () => {
        const inputs = resourcesInputs.current.querySelectorAll('input')
        const processName = resourcesInputs.current.querySelector('select').value
        const resourcesToBeAllocated = Array.from(inputs).map(({ value }) => parseInt(value))
        const toBeUpdatedLogs = [...logs]

        performBackup()
        System.clearEvents().allocateResources(processName, resourcesToBeAllocated)

        await handleSystemEvents(toBeUpdatedLogs)
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
                                disabled={readOnly}
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
                                disabled={readOnly}
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
                            <td>进程是否可执行 (Executable)</td>
                        </tr>
                        {
                            processes.map(({ name, allocations, needs, isFinish }, index) => (
                                <tr key={index}>
                                    <td style={{ background: workInfo?.id === index ? 'purple' : '' }}>
                                        <input
                                            className='hidden-input'
                                            defaultValue={name}
                                            disabled={readOnly}
                                            style={{
                                                fontWeight: workInfo?.id === index ? 'bold' : '',
                                                color: workInfo?.id === index ? 'white' : '',
                                                background: workInfo?.id === index ? 'transparent' : '',
                                            }}
                                        ></input>
                                    </td>
                                    <td className='flex-around'>{toFlexAround(InputGroupType.Allocation, index, allocations)}</td>
                                    <td className='flex-around'>{toFlexAround(InputGroupType.Need, index, needs)}</td>
                                    <td
                                        style={{ color: isFinish ? 'red' : 'green' }}
                                    >{isFinish ? '已完成' : '运行中'}</td>
                                    <td className='flex-around'>{
                                        workInfo?.id === index ? toFlexAround(InputGroupType.Allocation, index, workInfo.work) : ''
                                    }</td>
                                    <td
                                        className='flex-around'
                                        style={{ color: workInfo?.id === index ? (workInfo.executable ? 'green' : 'orange') : '' }}
                                    >{
                                            workInfo?.id === index ? (workInfo.executable ? '可执行' : '不可执行') : ''
                                        }</td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
                <div className='panel'>
                    <div className='left'>
                        <button onClick={checkSystemSafety} disabled={readOnly}>检查系统安全性</button>
                    </div>
                    <div className='right' ref={resourcesInputs}>
                        <span>尝试为进程分配资源：</span>
                        <select disabled={readOnly}>
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
                                disabled={readOnly}
                            ></input>
                        ))}
                        <button disabled={readOnly} onClick={allocateResource}>申请资源</button>
                    </div>
                </div>
                <div className='logs'>{logs.map(({ level, content }, index) => (
                    <p key={index} style={{ color: level }}>{`[${ getFormattedTime() }] ${ content }`}</p>
                ))}</div>
            </div>
        </>
    )
}

ReactDOM.render(
    <App />,
    document.getElementById('root')
)