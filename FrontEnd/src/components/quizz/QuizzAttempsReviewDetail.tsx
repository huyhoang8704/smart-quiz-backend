'use client';
import React, { useState } from "react";

import ComponentCard from "../common/ComponentCard";

import QuizzTakeExample from "./QuizzTakeExample";
import { QuizzDataType } from "@/utils/types";
import Button from "../ui/button/Button";
import { BoxIcon } from "@/icons";
import Radio from "../form/input/Radio";





export default function QuizzAttempsReviewDetail(data: {
    quizzData?: QuizzDataType
    details?: Array<{
        questionId: string
        question: string
        correctAnswer: string
        userAnswer?: string
        isCorrect: boolean
        _id: string
    }>
}) {
    const [quizzData] = useState(data.quizzData)
    const [details] = useState(data.details)


    return <>
        {quizzData?.questions.map((question, index) => {
            const found = details?.find(x => x.questionId === question._id)
            return <ComponentCard key={index} title={`Câu ${index + 1} : ${found?.isCorrect ? 'Đúng' : 'Sai'}`}>
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
                                    checked={found?.userAnswer === x}
                                    onChange={() => { }}
                                    // onChange={handleRadioChange}
                                    label={x}
                                    className={found?.isCorrect && x === found?.userAnswer ? 'bg-green-100 dark:bg-green-900/30 rounded-lg p-2' : (!found?.isCorrect && x === found?.userAnswer ? 'bg-red-100 dark:bg-red-900/30 rounded-lg p-2' : '')}
                                />
                            })}
                        </div>

                    </>}

                {["fillblank"].includes(question.type) &&
                    <>
                        <div className="flex flex-wrap items-center gap-8">
                            <p className="flex text-lg text-gray-500 dark:text-gray-400">
                                Câu trả lời của bạn :
                                <p className={found?.isCorrect ? 'ml-2 text-green-600 dark:text-green-400 font-semibold' : 'ml-2 text-red-600 dark:text-red-400 font-semibold'}>
                                    {found?.userAnswer}
                                </p>
                            </p>
                        </div>

                    </>}

                {found?.isCorrect === false && <p className="mt-4 text-red-500">
                    Câu trả lời đúng là : {found?.correctAnswer}
                </p>}


            </ComponentCard>
        })}
    </>

}