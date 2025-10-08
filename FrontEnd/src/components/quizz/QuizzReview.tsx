'use client';
import { QuizzDataType } from "@/utils/types";
import ComponentCard from "../common/ComponentCard"
import Radio from "../form/input/Radio"

export default function QuizzReview(props: {
    quizzData: QuizzDataType
}) {
    const { quizzData } = props
    if (!quizzData) return null
    return quizzData.questions.map((question, index) => {
        return <ComponentCard key={index} title={`Câu ${index + 1}`}>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">{question.question}</h4>
            {["mcq", 'truefalse'].includes(question.type) &&
                <>
                    <div className="flex flex-wrap items-center gap-8">
                        {question.options.map((x, indexOp) => {
                            return <Radio
                                key={indexOp}
                                id={question._id + indexOp.toString()}
                                name="group1"
                                value={x}
                                checked={x === question.answer}
                                onChange={() => { }}
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
                            Câu trả lời là : {question.answer}
                        </p>
                    </div>

                </>}


        </ComponentCard>
    })
}