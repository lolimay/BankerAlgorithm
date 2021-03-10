import ReactDOM from 'react-dom'
import React, { useState, useEffect } from 'react'
import { System } from './System'

import './index.scss'

function App() {
    const [resources, setResources] = useState([2, 3, 2])
    const [processes, setProcesses] = useState([
        { name: 'P1', allocations: [2, 1, 2], needs: [3, 4, 7], isFinish: false },
        { name: 'P2', allocations: [4, 0, 2], needs: [1, 3, 4], isFinish: false },
        { name: 'P3', allocations: [4, 0, 5], needs: [0, 0, 6], isFinish: false },
        { name: 'P4', allocations: [2, 0, 4], needs: [2, 2, 1], isFinish: false },
        { name: 'P5', allocations: [3, 1, 4], needs: [1, 1, 0], isFinish: false },
    ])

    const toFlexAround = (arr: number[]) => {
        return arr.map((num, index) => (
            <input key={index} className='hidden-input' value={num} ></input>
        ))
    }

    useEffect(() => {
        System.setProcesses(processes).setAvailableResources(resources)
    }, [resources, processes])

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
                            <td><input className='hidden-input' value={processes.length}></input></td>
                            <td><input className='hidden-input' value={resources.length}></input></td>
                            <td className='flex-around'>{toFlexAround(resources)}</td>
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
                                    <td><input className='hidden-input' value={name}></input></td>
                                    <td className='flex-around'>{toFlexAround(allocations)}</td>
                                    <td className='flex-around'>{toFlexAround(needs)}</td>
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
                        {resources.map((_, index) => <input key={index}></input>)}
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