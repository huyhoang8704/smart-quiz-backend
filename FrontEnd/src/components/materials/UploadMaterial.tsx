import { useModal } from "@/hooks/useModal";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { BoxIcon } from "@/icons";
import TextArea from "../form/input/TextArea";
import { useState } from "react";
import axiosInstance from "@/utils/axios";
import { toast } from "react-toastify";
import FileInput from "../form/input/FileInput";

export default function UploadMaterial(props: { onSuccess?: () => void }) {
    const { isOpen, openModal, closeModal } = useModal();
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileName, setFileName] = useState("")
    const [desc, setDesc] = useState("")

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.[0])
            setSelectedFile(event.target.files?.[0] as any); // For single file upload
    };
    const handleSave = async () => {
        // Handle save logic here

        if (!selectedFile) {
            alert('Please select a file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', fileName);
        formData.append('processedContent', desc);

        const rs = await axiosInstance(`/api/materials/upload`, {
            method: "POST",
            data: formData
        })

        if (rs.data) {
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
            toast.error("Tải lên tài liệu thất bại!", { position: "bottom-right" })
        }
        // rs.statusText
        // closeModal();
    };
    return <>
        <Button size="sm" variant="primary" endIcon={<BoxIcon />} onClick={openModal}>
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
                                    <Label>Tên file</Label>
                                    <Input
                                        type="text"
                                        defaultValue={fileName}
                                        onChange={event => setFileName(event.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label>Chọn file</Label>
                                    <FileInput
                                        onChange={handleFileChange}
                                    />
                                </div>

                                <div>
                                    <Label>Mô tả</Label>
                                    <TextArea
                                        value={desc}
                                        onChange={(value) => setDesc(value)}
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