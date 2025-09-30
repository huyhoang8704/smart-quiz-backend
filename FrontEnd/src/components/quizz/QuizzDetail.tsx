'use client';
import React, { Fragment, useEffect, useState } from "react";

import 'react-responsive-modal/styles.css';

import ComponentCard from "../common/ComponentCard";
import Image from "next/image";
import axiosInstance from "@/utils/axios";
import Radio from "../form/input/Radio";
import PageBreadcrumb from "../common/PageBreadCrumb";
import QuizzReview from "./QuizzReview";
import { DIFFICULTY_NAME, QUIZZ_TYPE_NAME } from "@/utils/enum";

const getQuizzDetail = async (id: string) => {
    const rs = await axiosInstance(`/api/quizzes/${id}`, {
        method: "GET",
    })
    console.log(rs.data)
    return rs.data
}

export default function QuizzDetail(data: { quizzId: string }) {
    console.log("🚀 ~ QuizzDetail ~ data:", data)

    const [quizzData, setQuizzData] = useState<{
        settings: {
            totalQuestions: number
            questionConfigs: Array<{
                type: string
                count: number
                difficulty: string
                _id: string
            }>
            focusAreas: Array<string>
            customInstructions: string
            numQuestions: number
            difficulty: string
        }
        _id: string
        ownerId: string
        materialId: {
            _id: string
            ownerId: string
            title: string
            type: string
            filePath: string
            url: string
            processedContent: string
            createdAt: string
            updatedAt: string
            __v: number
        }
        title: string
        questions: Array<{
            question: string
            type: string
            options: Array<string>
            answer: string
            difficulty: string
            _id: string
        }>
        createdAt: string
        updatedAt: string
        __v: number
    }

    >()

    useEffect(() => {
        getQuizzDetail(data.quizzId).then(rs => {
            console.log("🚀 ~ QuizzDetail ~ rs:", rs)
            setQuizzData(rs)

        })
    }, [data.quizzId])

    return <>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
                Chi tiết quizz
            </h3>
            <div className="space-y-6">
                <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                            {/* <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                            <Image
                                width={80}
                                height={80}
                                src="https://avatars.githubusercontent.com/u/30893021?v=4&size=64"
                                alt="user"
                            />
                        </div> */}
                            <div className="order-3 xl:order-2">
                                <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                                    {quizzData?.title}
                                </h4>
                                <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Số lượng : {quizzData?.settings.totalQuestions}
                                    </p>
                                </div>
                                {quizzData?.settings.questionConfigs.map((quesCo, i) => {
                                    return <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Loại : {QUIZZ_TYPE_NAME[quesCo.type]}
                                        </p>
                                        <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Độ khó : {DIFFICULTY_NAME[quesCo.difficulty]}
                                        </p>
                                        <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Số lượng : {quesCo.count}
                                        </p>
                                    </div>
                                })}
                            </div>
                        </div>

                    </div>
                </div>

                {quizzData && <QuizzReview quizzData={quizzData} />}


            </div>
        </div>
    </>
    return (
        <ComponentCard title="Chi tiết quizz">
            <div className="mx-auto w-full max-w-[630px]">
                {/* <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
                    Card Title Here
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
                    Start putting content on grids or panels, you can also use different
                    combinations of grids.Please check out the dashboard and other pages
                </p> */}
                álk;dja;slkjal;skdl;kjas
            </div>
        </ComponentCard>
    )
}