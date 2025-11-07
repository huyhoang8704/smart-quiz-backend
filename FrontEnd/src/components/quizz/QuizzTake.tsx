'use client';
import React, { useCallback, useEffect, useRef, useState } from "react";

import 'react-responsive-modal/styles.css';

import QuizzTakeExample from "./QuizzTakeExample";
import { QuizzDataType } from "@/utils/types";
import Button from "../ui/button/Button";
import { BoxIcon } from "@/icons";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";
// import { useConfirmRouteExit } from "@/hooks/useConfirmRouteExit";
import useUnsavedChangesWarning from "@/hooks/useUnsavedChangesWarning";
import CountdownTimer from "./CountdownTimer";




export default function QuizzTake(data: { quizzId: string }) {
    const { replace } = useRouter()
    const { axiosInstance, status } = useAxiosAuth()
    const getQuizzDetail = useCallback(async (id: string) => {
        const rs = await axiosInstance(`/api/quizzes/${id}`, {
            method: "GET",
        })
        console.log(rs.data)
        return rs.data
    }, [axiosInstance])

    const submitQuizzAnswered = useCallback(async (dataSubmit: any) => {
        const rs = await axiosInstance(`/api/quizzes/${data.quizzId}/attempt`, {
            method: "POST",
            data: dataSubmit
        })
        console.log(rs.data)
        return rs.data
    }, [data.quizzId, axiosInstance])

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

    const quizzTakeExampleRef = useRef<{ getData: () => QuizzDataType['questions'], getDataForce: () => QuizzDataType['questions'] }>(null)

    const handleOnClickSubmit = useCallback(async () => {
        const answeredQuestions = quizzTakeExampleRef.current?.getData()
        console.log("🚀 ~ handleOnClickSubmit ~ answeredQuestions:", answeredQuestions)
        if (answeredQuestions) {
            try {
                Swal.fire({
                    title: "Đang nộp bài...",
                    html: "Vui lòng đợi trong giây lát!",
                    icon: "info",
                    showConfirmButton: false,
                    showDenyButton: false,
                    showCancelButton: false,
                    allowOutsideClick: false,
                    timerProgressBar: true,
                    allowEscapeKey: false
                })

                const rs = await submitQuizzAnswered(answeredQuestions.map(x => {
                    return {
                        questionId: x._id,
                        answer: x.answer
                    }
                }))
                Swal.close()
                toast.success(rs.message, { position: "bottom-right" })
                console.log("🚀 ~ handleOnClickSubmit ~ rs:", rs)
                replace(`/quizzresult`)
            } catch (error) {
                console.log("🚀 ~ QuizzTake ~ error:", error)
                Swal.close()
                if (error.message) {
                    toast.success(error.message, { position: "bottom-right" })
                }
            }

        }
    }, [submitQuizzAnswered, replace])

    const handleOnClickSubmitAuto = useCallback(async () => {
        const answeredQuestions = quizzTakeExampleRef.current?.getDataForce()
        if (answeredQuestions) {
            try {
                Swal.fire({
                    title: "Đang nộp bài...",
                    html: "Vui lòng đợi trong giây lát!",
                    icon: "info",
                    showConfirmButton: false,
                    showDenyButton: false,
                    showCancelButton: false,
                    allowOutsideClick: false,
                    timerProgressBar: true,
                    allowEscapeKey: false
                })

                const rs = await submitQuizzAnswered(answeredQuestions.map(x => {
                    return {
                        questionId: x._id,
                        answer: x.answer
                    }
                }))
                Swal.close()
                toast.success(rs.message, { position: "bottom-right" })
                console.log("🚀 ~ handleOnClickSubmit ~ rs:", rs)
                replace(`/quizzresult`)
            } catch (error) {
                console.log("🚀 ~ QuizzTake ~ error:", error)
                Swal.close()
                if (error.message) {
                    toast.success(error.message, { position: "bottom-right" })
                }
            }

        }
    }, [submitQuizzAnswered, replace])

    useEffect(() => {
        if (status === "authenticated") {
            getQuizzDetail(data.quizzId).then(rs => {
                console.log("🚀 ~ QuizzDetail ~ rs:", rs)
                setQuizzData(rs)
            })

        }
    }, [data.quizzId, getQuizzDetail, status])


    // useBeforeUnload(true)
    useUnsavedChangesWarning(true, useRef('Rời khỏi trang bạn sẽ mất dữ liệu!').current);
    // useConfirmRouteExit(true, "Rời khỏi trang bạn sẽ mất dữ liệu!")

    return <>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
                Làm bài quizz
            </h3>

            <div className="space-y-6">
                <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                            <div className="order-3 xl:order-2">
                                <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                                    {quizzData?.title}
                                </h4>
                                <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Số lượng : {quizzData?.settings.totalQuestions}
                                    </p>
                                </div>

                            </div>
                        </div>
                        <CountdownTimer onComplete={handleOnClickSubmitAuto} />

                    </div>
                </div>

                {quizzData && <QuizzTakeExample ref={quizzTakeExampleRef} quizzData={quizzData} />}
                <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                    <Button size="sm" variant="primary" endIcon={<BoxIcon
                    />} onClick={handleOnClickSubmit}>
                        Nộp bài
                    </Button>
                </div>

            </div>
        </div>
    </>
}