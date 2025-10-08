"use client"
import { BoxIcon, ChevronDownIcon } from "@/icons";
import Button from "../ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Select from "../form/Select";
import Input from "../form/input/InputField";
import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "@/utils/axios";
import { toast } from "react-toastify";
import ComponentCard from "../common/ComponentCard";
import QuestionConfigs from "./QuestionConfigs";
import TextArea from "../form/input/TextArea";
import CreatableSelect from 'react-select/creatable';
import Swal from 'sweetalert2';
import QuizzReview from "./QuizzReview";
import { QuizzDataType, RequestCreateQuizz } from "@/utils/types";


const getListData = async () => {
    const rs = await axiosInstance(`/api/materials`, {
        method: "GET",
    })
    console.log(rs.data)
    return rs.data
}

const createQuizz = async (data: RequestCreateQuizz) => {
    try {
        const rs = await axiosInstance(`/api/quizzes/generate`, {
            method: "POST",
            data
        })

        return rs.data
    } catch (error) {
        return error

    }
}

const deleteQuizz = async (id: string) => {
    try {
        const rs = await axiosInstance(`/api/quizzes/${id}`, {
            method: "DELETE",
        })

        return rs.data
    } catch (error) {
        return error

    }
}


export default function CreateQuizzButton(props: { onCreateSuccess?: () => void }) {
    const { isOpen, openModal, closeModal } = useModal();
    const { isOpen: isOpenPreview, openModal: openModalPreview, closeModal: closeModalPrivew } = useModal();


    const [quizzDataCreate, setQuizzDataCreate] = useState<QuizzDataType>()


    const [quizzName, setQuizzName] = useState("")
    const [focusAreas, setFocusAreas] = useState<string[]>([])
    const [selectedFile, setSelectedFile] = useState<string>()
    const [customInstructions, setCustomInstructions] = useState<string>("")
    const [inProcess, setInProcess] = useState(false)
    const [listMarterials, setListMarterials] = useState<{
        _id: string
        ownerId: string
        title: string
        type: string
        filePath: string
        processedContent: string
        createdAt: string
        updatedAt: string
        __v: number
    }[]>([])

    const quizzConfigRef = useRef<any>(null)

    const handleSave = useCallback(async () => {
        if (!selectedFile) {
            return toast.error("Vui lòng chọn tài liệu", { position: "bottom-right" })
        }
        if (!quizzName) {
            return toast.error("Vui lòng điền tên quizz", { position: "bottom-right" })
        }

        const questionConfigs: RequestCreateQuizz['settings']['questionConfigs'] = quizzConfigRef.current?.getSettingsConfig()

        const dataRequest: RequestCreateQuizz = {
            "materialId": selectedFile,
            settings: {
                questionConfigs: questionConfigs,
                customTitle: quizzName,
                customInstructions: customInstructions,
                focusAreas: focusAreas
            },

        }

        console.log("🚀 ~ handleSave ~ dataRequest:", dataRequest)
        setInProcess(true)
        Swal.fire({
            title: "Đang tạo tài liệu",
            html: "Vui lòng đợi trong giây lát!",
            icon: "info",
            showConfirmButton: false,
            showDenyButton: false,
            showCancelButton: false,
            allowOutsideClick: false,
            timerProgressBar: true,
            allowEscapeKey: false
        })
        const createRs = await createQuizz(dataRequest)
        console.log("🚀 ~ handleSave ~ createRs:", createRs, JSON.stringify(createRs))

        setInProcess(false)


        Swal.close()
        if (createRs.status === 500) {
            closeModal()
            return toast.error(createRs?.response?.data?.error || createRs.message, { position: "bottom-right" })
        }

        if (createRs._id !== undefined) {
            setQuizzDataCreate(createRs)
            openModalPreview()
            // props.onCreateSuccess?.()
            // return toast.success("Tạo quizz thành công", { position: "bottom-right" })
        }



    }, [closeModal, customInstructions, focusAreas, props, quizzName, selectedFile, openModalPreview])

    useEffect(() => {
        getListData().then(async x => {
            setListMarterials(x)
        })
    }, [])

    return <>
        <Button size="sm" variant="primary" endIcon={<BoxIcon
        />} onClick={openModal}>
            Tạo quizz mới
        </Button>
        <Modal isOpen={isOpen} onClose={closeModal} isFullscreen showCloseButton={!inProcess}>
            <div className="fixed top-0 left-0 flex flex-col justify-between w-full h-screen p-6 overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900 lg:p-10">
                <div className="px-2 pr-14">
                    <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                        Tạo quizz mới
                    </h4>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                        Tạo quizz tự động dựa trên tài liệu
                    </p>
                </div>
                <div className="flex flex-col">
                    <div className="custom-scrollbar overflow-y-auto px-2 pb-3">
                        <div>
                            <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                                Thông tin
                            </h5>

                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-1">
                                <div>
                                    <Label>Tên quizz</Label>
                                    <Input
                                        type="text"
                                        defaultValue={quizzName}
                                        onChange={event => setQuizzName(event.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Chọn tài liệu</Label>
                                    <div className="relative">
                                        <Select
                                            options={listMarterials.map(x => {
                                                return {
                                                    label: x.title,
                                                    value: x._id
                                                }
                                            })}
                                            placeholder="Chọn tài liệu tham khảo"
                                            onChange={(value: string) => {
                                                setSelectedFile(value)
                                            }}
                                            className="dark:bg-dark-900"
                                        />
                                        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                                            <ChevronDownIcon />
                                        </span>
                                    </div>
                                </div>

                                <ComponentCard title="Cài đặt câu hỏi">
                                    {/* <div>
                                        <Label>Upload file</Label>
                                        <FileInput onChange={handleFileChange} className="custom-class" />
                                    </div> */}
                                    <QuestionConfigs ref={quizzConfigRef} />
                                </ComponentCard>


                                <div>
                                    <Label>Tập trung vào các chủ đề</Label>
                                    <CreatableSelect isMulti onChange={(newVal) => {
                                        setFocusAreas(newVal.map((x: any) => x.value))
                                    }} />
                                </div>

                                <div>
                                    <Label>Mô tả chi tiết thêm</Label>
                                    <TextArea
                                        value={customInstructions}
                                        onChange={(value) => setCustomInstructions(value)}
                                        rows={6}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                        <Button size="sm" variant="outline" onClick={closeModal} disabled={inProcess} >
                            Đóng
                        </Button>
                        <Button size="sm" disabled={inProcess} onClick={handleSave}>
                            Xác nhận
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>


        <Modal isOpen={isOpenPreview} onClose={closeModalPrivew} isFullscreen >
            <div className="fixed top-0 left-0 flex flex-col justify-between w-full h-screen p-6 overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900 lg:p-10 space-y-6">
                <div className="px-2 pr-14">
                    <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                        Xem lại quizz
                    </h4>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                        Xác nhận quizz
                    </p>
                </div>
                {quizzDataCreate && <QuizzReview quizzData={quizzDataCreate} />}

                <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                    <Button size="sm" variant="outline" onClick={() => {
                        closeModalPrivew()
                        if (quizzDataCreate?._id) {
                            deleteQuizz(quizzDataCreate._id)
                        }
                    }} disabled={inProcess} >
                        Tạo lại
                    </Button>
                    <Button size="sm" disabled={inProcess} onClick={() => {
                        props.onCreateSuccess?.()
                        closeModal()
                        closeModalPrivew()
                    }}>
                        Xác nhận
                    </Button>
                </div>
            </div>
        </Modal>
    </>
}