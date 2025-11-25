'use client';
import React, { useCallback, useEffect, useRef, useState } from "react";

import 'react-responsive-modal/styles.css';

import ComponentCard from "../common/ComponentCard";

import { DIFFICULTY_NAME, QUIZZ_TYPE_NAME } from "@/utils/enum";
import QuizzTakeExample from "./QuizzTakeExample";
import { QuizzDataType } from "@/utils/types";
import Button from "../ui/button/Button";
import { BoxIcon } from "@/icons";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

import { formatDateVn } from "@/utils/commom";
import Label from "../form/Label";
import { Modal } from "../ui/modal";
import { useModal } from "@/hooks/useModal";
import QuizzAttempsReviewDetail from "./QuizzAttempsReviewDetail";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";





export default function QuizzAttempsReview(data: { quizzId: string }) {
    const { replace } = useRouter()
    const { isOpen, openModal, closeModal } = useModal();
    const { axiosInstance, status } = useAxiosAuth(); // <--- Lấy instance đã có token

    const getQuizzDetail = useCallback(async (id: string) => {
        const rs = await axiosInstance(`/api/quizzes/${id}`, {
            method: "GET",
        })
        console.log(rs.data)
        return rs.data
    }, [axiosInstance])

    const getQuizzAttemps = useCallback(async (id: string) => {
        try {
            const rs = await axiosInstance(`/api/quizzes/${id}/attempts`, {
                method: "GET",
            })
            console.log(rs.data)
            return rs.data
        } catch (error) {
            console.log("🚀 ~ QuizzAttempsReview ~ error:", error)
            return []
        }
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


    const [listAttempts, setListAttempts] = useState<Array<{
        _id: string
        quizId: string
        studentId: {
            _id: string
            email: string
        }
        score: number
        totalQuestions: number
        correctAnswers: number
        timeConfig?: number // minute
        timeSpent?: number // minute
        details: Array<{
            questionId: string
            question: string
            correctAnswer: string
            userAnswer?: string
            isCorrect: boolean
            _id: string
        }>
        createdAt: string
        updatedAt: string
        __v: number
    }>
    >([])

    const [selectedAttempt, setSelectedAttempt] = useState<typeof listAttempts[0] | undefined>()

    const quizzTakeExampleRef = useRef<{ getData: () => QuizzDataType['questions'] }>(null)

    const handleOnClickSubmit = useCallback(async () => {
        const answeredQuestions = quizzTakeExampleRef.current?.getData()
        console.log("🚀 ~ handleOnClickSubmit ~ answeredQuestions:", answeredQuestions)
        if (answeredQuestions) {
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

        }
    }, [submitQuizzAnswered, replace])

    useEffect(() => {
        if (status !== "authenticated") return;
        getQuizzDetail(data.quizzId).then(rs => {
            console.log("🚀 ~ QuizzDetail ~ rs:", rs)
            setQuizzData(rs)
        })

        getQuizzAttemps(data.quizzId).then(rs => {
            console.log("🚀 ~ getQuizzAttemps ~ rs:", rs)
            setListAttempts(rs)
        })
    }, [data.quizzId, getQuizzDetail, getQuizzAttemps, status])

    return <>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
                Chi tiết quizz
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
                                {quizzData?.settings.questionConfigs.map((quesCo, i) => {
                                    return <div key={i} className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Loại : {QUIZZ_TYPE_NAME[quesCo.type as any]}
                                        </p>
                                        <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Độ khó : {DIFFICULTY_NAME[quesCo.difficulty as any]}
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

                {/* {quizzData && <QuizzReview quizzData={quizzData} />} */}
                <div className="grid xl:grid-cols-4 gap-5 sm:gap-6 xl:grid-cols-4 md:grid-cols-2 sm:grid-cols-1">
                    {listAttempts.map((attempt, index) => {
                        return <ComponentCard key={index} title={formatDateVn(new Date(attempt.createdAt))}>
                            <div className="grid grid-cols-2">
                                <div>
                                    <div>
                                        <Label>Điểm số : {attempt.score}/100</Label>
                                    </div>

                                    {attempt.timeConfig && <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Thời gian giới hạn : {attempt.timeConfig} phút
                                        </p>
                                    </div>}


                                    {attempt.timeSpent && <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Thời gian làm bài : {attempt.timeSpent} phút
                                        </p>
                                    </div>}


                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Số câu đúng : {attempt.details.filter(x => x.isCorrect).length}
                                        </p>
                                    </div>

                                </div>

                                <div className="flex justify-end">
                                    <Button size="sm" variant="primary" onClick={() => {
                                        // push(`/quizzs/${data}/attempts`)
                                        openModal()
                                        setSelectedAttempt(attempt)
                                    }}>
                                        Chi tiết
                                    </Button>
                                </div>
                            </div>

                        </ComponentCard>
                    })}
                </div>

            </div>
        </div>


        <Modal isOpen={isOpen} onClose={closeModal} isFullscreen>
            <div className="fixed top-0 left-0 flex flex-col justify-between w-full h-screen p-6 overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900 lg:p-10">
                {/* <div className="px-2 pr-14">
                    <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                        Tạo quizz mới
                    </h4>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                        Tạo quizz tự động dựa trên tài liệu
                    </p>
                </div> */}
                <div className="space-y-6">

                    <QuizzAttempsReviewDetail quizzData={quizzData} details={selectedAttempt?.details} />
                </div>

            </div>
        </Modal>
    </>

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