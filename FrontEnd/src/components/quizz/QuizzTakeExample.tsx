'use client';
import { QuizzDataType } from "@/utils/types";
import ComponentCard from "../common/ComponentCard"
import Radio from "../form/input/Radio"
import { forwardRef, useImperativeHandle, useState } from "react";
import Input from "../form/input/InputField";
import { toast } from "react-toastify";

const QuizzTakeExample = (props: {
    quizzData: QuizzDataType
}, ref: any) => {
    const { quizzData } = props

    const [answeredQuestions, setAnsweredQuestions] = useState((quizzData?.questions || []).map((x) => {
        return {
            ...x,
            answer: ""
        }
    }))

    useImperativeHandle(ref, () => ({
        getData: () => {
            const listError: string[] = []
            for (let i = 0; i < answeredQuestions.length; i++) {
                if (!answeredQuestions[i].answer) {

                    listError.push(`${i + 1}`)
                }
            }
            if (listError.length > 0) {
                toast.error(`Các câu ${listError.join(',')} chưa được trả lời!`, { position: "bottom-right" })
                return null

            }

            return answeredQuestions
        }
    }), [answeredQuestions])

    if (!quizzData) return null
    return answeredQuestions.map((question, index) => {
        return <ComponentCard key={index} title={`Câu ${index + 1}`}>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">{question.question}</h4>
            {["mcq", 'truefalse'].includes(question.type) &&
                <>
                    <div className="flex flex-wrap items-center gap-8">
                        {question.options.map((x, indexOp) => {
                            return <Radio
                                key={indexOp}
                                id={question._id + indexOp.toString()}
                                name={question._id}
                                value={x}
                                checked={x === question.answer}
                                onChange={() => {
                                    const newAnsweredQuestions = [...answeredQuestions]
                                    newAnsweredQuestions[index].answer = x
                                    setAnsweredQuestions(newAnsweredQuestions)
                                }}
                                // onChange={handleRadioChange}
                                label={x}
                            />
                        })}
                    </div>

                </>}

            {["fillblank"].includes(question.type) &&
                <>
                    <div className="flex flex-wrap items-center gap-8">
                        <p className="text-lg text-gray-500 dark:text-gray-400">
                            Câu trả lời là :
                            <Input type="text" placeholder="Điền câu trả lời của bạn" value={question.answer} onChange={e => {
                                const newAnsweredQuestions = [...answeredQuestions]
                                newAnsweredQuestions[index].answer = e.target.value
                                setAnsweredQuestions(newAnsweredQuestions)
                            }} />
                        </p>
                    </div>

                </>}


        </ComponentCard>
    })
}
export default forwardRef<{ getData: () => QuizzDataType['questions'] }, {
    quizzData: QuizzDataType
}>(QuizzTakeExample)