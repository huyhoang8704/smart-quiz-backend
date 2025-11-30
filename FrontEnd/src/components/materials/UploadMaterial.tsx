import { useModal } from "@/hooks/useModal";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { BoxIcon } from "@/icons";
import TextArea from "../form/input/TextArea";
import { useState } from "react";

import { toast } from "react-toastify";
import FileInput from "../form/input/FileInput";
import Swal from "sweetalert2";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";

export default function UploadMaterial(props: { onSuccess?: () => void }) {
    const { isOpen, openModal, closeModal } = useModal();
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileName, setFileName] = useState("")
    const [desc, setDesc] = useState("")
    const { axiosInstance } = useAxiosAuth(); // <--- Lấy instance đã có token

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.[0])
            setSelectedFile(event.target.files?.[0] as any); // For single file upload
    };
    const handleSave = async () => {
        // Handle save logic here
        let errorMessage = "Tải lên tài liệu thất bại!"

        if (!fileName) {
            return toast.error("Vui lòng điền tên file", { position: "bottom-right" })
        }

        if (!selectedFile) {
            return toast.error("Vui lòng chọn file", { position: "bottom-right" })
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', fileName);
        formData.append('processedContent', desc);




        Swal.fire({
            title: "Đang xử lý",
            html: "Vui lòng đợi trong giây lát!",
            icon: "info",
            showConfirmButton: false,
            showDenyButton: false,
            showCancelButton: false,
            allowOutsideClick: false,
            timerProgressBar: true,
            allowEscapeKey: false
        })
        const rs = await axiosInstance(`/api/materials/upload`, {
            method: "POST",
            data: formData
        }).catch((e) => {
            console.log("🚀 ~ handleSave ~ e:", e)
            Swal.close()
            if (e?.response?.data?.error) {
                errorMessage = e?.response?.data?.error
            }
        })
        Swal.close()
        console.log("🚀 ~ handleSave ~ rs:", rs)
        if (rs?.data) {
            toast.success("Tải lên tài liệu thành công!", {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
            setFileName("")
            setDesc("")
            setSelectedFile(null)
            closeModal();
            props.onSuccess?.()
        } else {
            toast.error(errorMessage, { position: "bottom-right" })
        }
        // rs.statusText
        // closeModal();
    };
    return <>
        <Button size="sm" variant="primary" endIcon={<BoxIcon />} onClick={() => {
            setFileName("")
            setDesc("")
            setSelectedFile(null)
            openModal()
        }}>
            Thêm tài liệu
        </Button>

        <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
            <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                <div className="px-2 pr-14">
                    <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                        Thêm tài liệu
                    </h4>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                        Tải tài liệu của bạn lên
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
                                    <Label>Tên file <span className="text-error-500">*</span>{" "}</Label>
                                    <Input
                                        type="text"
                                        defaultValue={fileName}
                                        required
                                        minLength={1}
                                        maxLength={50}
                                        onChange={event => setFileName(event.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label>Chọn file <span className="text-error-500">*</span>{" (.pdf, .docx, .doc, .txt, .mp4)"}</Label>
                                    <FileInput
                                        onChange={handleFileChange}
                                        accept="application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain, video/mp4"
                                    />
                                </div>

                                <div>
                                    <Label>Mô tả</Label>
                                    <TextArea
                                        value={desc}
                                        onChange={(value) => setDesc(value)}
                                        className="text-base font-medium text-gray-800 dark:text-white/90"
                                        rows={6}
                                    />
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