import { forwardRef, useImperativeHandle, useState } from "react"
import Label from "../form/Label"
import Input from "../form/input/InputField"
import { ChevronDownIcon } from "@/icons"
import Select from "../form/Select"

const QuestionConfigs = forwardRef<{
    getSettingsConfig: () => Array<{
        type: "mcq" | "truefalse" | "fillblank"
        count: number
        difficulty: "easy" | "medium" | "hard"
    }>
}, unknown>((props, ref) => {

    const [configMcq, setConfigMcq] = useState({
        type: "mcq",
        count: 5,
        difficulty: "easy"
    })


    const [configTrueFalse, setConfigTrueFalse] = useState({
        type: "truefalse",
        count: 5,
        difficulty: "easy"
    })

    const [configFillBlank, setConfigFillBlank] = useState({
        type: "fillblank",
        count: 5,
        difficulty: "easy"
    })



    useImperativeHandle(
        ref,
        () => ({
            getSettingsConfig: () => {
                return [
                    {
                        "type": "mcq",
                        "count": configMcq.count,
                        "difficulty": configMcq.difficulty
                    },
                    {
                        "type": "truefalse",
                        "count": configTrueFalse.count,
                        "difficulty": configTrueFalse.difficulty
                    },
                    {
                        "type": "fillblank",
                        "count": configFillBlank.count,
                        "difficulty": configFillBlank.difficulty
                    }
                ] as any
            }
        }),
        [configMcq, configTrueFalse, configFillBlank]
    )
    return <>
        <div>
            <Label>Trắc nghiệm nhiều lựa chọn</Label>
            <div>
                <Label>Số câu</Label>
                <Input
                    type="number"
                    defaultValue={configMcq.count}
                    onChange={event => {
                        setConfigMcq(pre => ({ ...pre, count: Number(event.target.value) }))
                    }}
                />
            </div>

            <div>
                <Label>Độ khó</Label>
                <div className="relative">
                    <Select
                        options={[
                            { value: "easy", label: "Dễ", },
                            { value: "medium", label: "Trung bình", },
                            { value: "hard", label: "Khó", },
                        ]}
                        placeholder="Chọn độ khó"
                        defaultValue={configMcq.difficulty}
                        onChange={(value: string) => {
                            setConfigMcq(prev => ({ ...prev, difficulty: value }))
                        }}
                        className="dark:bg-dark-900"
                    />
                    <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                        <ChevronDownIcon />
                    </span>
                </div>
            </div>
        </div>

        <div>
            <Label>Câu hỏi đúng/sai</Label>
            <div>
                <Label>Số câu</Label>
                <Input
                    type="number"
                    defaultValue={configTrueFalse.count}
                    onChange={event => {
                        setConfigTrueFalse(pre => ({ ...pre, count: Number(event.target.value) }))
                    }}
                />
            </div>

            <div>
                <Label>Độ khó</Label>
                <div className="relative">
                    <Select
                        options={[
                            { value: "easy", label: "Dễ", },
                            { value: "medium", label: "Trung bình", },
                            { value: "hard", label: "Khó", },
                        ]}
                        placeholder="Chọn độ khó"
                        defaultValue={configMcq.difficulty}
                        onChange={(value: string) => {
                            setConfigTrueFalse(prev => ({ ...prev, difficulty: value }))
                        }}
                        className="dark:bg-dark-900"
                    />
                    <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                        <ChevronDownIcon />
                    </span>
                </div>
            </div>
        </div>

        <div>
            <Label>Điền chỗ trống</Label>
            <div>
                <Label>Số câu</Label>
                <Input
                    type="number"
                    defaultValue={configFillBlank.count}
                    onChange={event => {
                        setConfigFillBlank(pre => ({ ...pre, count: Number(event.target.value) }))
                    }}
                />
            </div>

            <div>
                <Label>Độ khó</Label>
                <div className="relative">
                    <Select
                        options={[
                            { value: "easy", label: "Dễ", },
                            { value: "medium", label: "Trung bình", },
                            { value: "hard", label: "Khó", },
                        ]}
                        placeholder="Chọn độ khó"
                        defaultValue={configMcq.difficulty}
                        onChange={(value: string) => {
                            setConfigFillBlank(prev => ({ ...prev, difficulty: value }))
                        }}
                        className="dark:bg-dark-900"
                    />
                    <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                        <ChevronDownIcon />
                    </span>
                </div>
            </div>
        </div>
    </>
})
export default QuestionConfigs