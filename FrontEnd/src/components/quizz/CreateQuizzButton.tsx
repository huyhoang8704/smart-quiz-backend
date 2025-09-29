import { BoxIcon, ChevronDownIcon } from "@/icons";
import Button from "../ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Select from "../form/Select";
import Input from "../form/input/InputField";
import { useEffect, useState } from "react";
import axiosInstance from "@/utils/axios";
import { toast } from "react-toastify";

const getListData = async () => {
    const rs = await axiosInstance(`/api/materials`, {
        method: "GET",
    })
    console.log(rs.data)
    return rs.data
}

const createQuizz = async (data: unknown) => {
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

export default function CreateQuizzButton() {
    const { isOpen, openModal, closeModal } = useModal();
    const [quizzName, setQuizzName] = useState("")
    const [numberOfQuestion, setNumberOfQuestion] = useState(5)
    const [selectedFile, setSelectedFile] = useState<string>()
    const [selectedDiff, setSelectedDiff] = useState<string>()
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

    const handleSave = async () => {
        if (!selectedFile) {
            return toast.error("Vui lòng chọn tài liệu", { position: "bottom-right" })
        }
        if (!quizzName) {
            return toast.error("Vui lòng điền tên quizz", { position: "bottom-right" })
        }

        if (!numberOfQuestion || numberOfQuestion < 0) {
            return toast.error("Vui lòng điền đúng số lượng câu hỏi", { position: "bottom-right" })
        }
        if (!selectedDiff) {
            return toast.error("Vui lòng chọn độ khó", { position: "bottom-right" })
        }
        const dataRequest = {
            "materialId": selectedFile,
            "options": {
                "title": quizzName,
                "numQuestions": numberOfQuestion,
                "difficulty": selectedDiff
            }
        }

        console.log("🚀 ~ handleSave ~ dataRequest:", dataRequest)
        const createRs = await createQuizz(dataRequest)
        console.log("🚀 ~ handleSave ~ createRs:", createRs)
        if (createRs.status === 500) {
            closeModal()
            return toast.error(createRs?.response?.data?.error || createRs.message, { position: "bottom-right" })
        }



    };

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
        <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
            <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                <div className="px-2 pr-14">
                    <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                        Tạo quizz mới
                    </h4>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                        Tạo quizz tự động dựa trên tài liệu
                    </p>
                </div>
                <div className="flex flex-col">
                    <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
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

                                <div>
                                    <Label>Số lượng câu hỏi</Label>
                                    <Input
                                        type="number"
                                        defaultValue={numberOfQuestion}
                                        onChange={event => setNumberOfQuestion(Number(event.target.value))}
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
                                            onChange={(value: string) => {
                                                setSelectedDiff(value)
                                            }}
                                            className="dark:bg-dark-900"
                                        />
                                        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                                            <ChevronDownIcon />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                        <Button size="sm" variant="outline" onClick={closeModal}>
                            Đóng
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            Xác nhận
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    </>
}