// QuizzTables.tsx (Đã sửa lỗi Worker và Dynamic Imports)
"use client";
import React, { useCallback, useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import 'datatables.net-dt/css/dataTables.dataTables.css';
// *** IMPORTS CSS (Đã bỏ comment) ***
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/toolbar/lib/styles/index.css';

import { ConfigColumns } from 'datatables.net-dt';
import Button from "../ui/button/Button";

import ComponentCard from "../common/ComponentCard";
import { hydrateRoot } from "react-dom/client";

import { useRouter } from "next/navigation";
import CreateQuizzButton from "../quizz/CreateQuizzButton";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

import { useAxiosAuth } from "@/hooks/useAxiosAuth";
import { Modal } from "../ui/modal";

// *** DYNAMIC IMPORTS ***
const DataTable = dynamic(
  async () => {
    import(`datatables.net-buttons-dt`);
    const dtReact = import('datatables.net-react');
    const dtNet = import(`datatables.net-dt`);

    const [reactMod, dtNetMod] = await Promise.all([dtReact, dtNet]);

    reactMod.default.use(dtNetMod.default);
    return reactMod.default;
  },
  { ssr: false }
);

// THAY ĐỔI QUAN TRỌNG: Import component PDFViewer mới tạo
const PDFViewer = dynamic(() => import("../pdf/PDFViewer"), {
  ssr: false,
  loading: () => <div className="p-10 text-center">Đang tải trình đọc PDF...</div>
});
// *** END DYNAMIC IMPORTS ***




export default function QuizzTables() {
  const { axiosInstance: axiosAuth, status } = useAxiosAuth();
  const getListData = useCallback(async () => {
    const rs = await axiosAuth(`/api/quizzes`, {
      method: "GET",
    })
    console.log(rs.data)
    return rs.data
  }, [axiosAuth])

  const [tableData, setTableData] = useState([
  ]);

  const [loading, setLoading] = useState(false);

  const { push } = useRouter()

  const refreshData = useCallback(() => {
    setLoading(true)
    getListData().then(async x => {
      setTableData(x)
      setLoading(false)
    })
  }, [getListData])


  const deleteQuizz = useCallback(async (id: string) => {
    try {
      const rs = await axiosAuth(`/api/quizzes/${id}`, {
        method: "DELETE",
      })

      return rs.data
    } catch (error) {
      return error
    }
  }, [axiosAuth])


  useEffect(() => {
    if (status === "authenticated")
      refreshData()
  }, [refreshData, status])

  useEffect(() => {
    if (loading) {
      Swal.fire({
        title: "Đang tải dữ liệu",
        html: "Vui lòng đợi trong giây lát!",
        icon: "info",
        showConfirmButton: false,
        showDenyButton: false,
        showCancelButton: false,
        allowOutsideClick: false,
        timerProgressBar: true,
        allowEscapeKey: false
      })
    } else {
      Swal.close()
    }
  }, [loading])
  // State quản lý Preview Modal
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentFilename, setCurrentFilename] = useState("quiz-export.pdf");

  // Hàm render DefaultLayout
  const renderDefaultLayout = useCallback((props: any) => (
    <DefaultLayout {...props} />
  ), []);

  // Hàm xử lý việc xuất/in quiz
  const handlePrintQuizz = (quizzId: string) => {
    // ... (Swal.fire logic giữ nguyên) ...
    Swal.fire({
      title: "Bạn có muốn in quiz này không?",
      input: "checkbox",
      inputLabel: "Kèm đáp án",
      inputAttributes: {},
      showCancelButton: true,
      cancelButtonText: "Huỷ",
      confirmButtonText: "Xác nhận",
      showLoaderOnConfirm: true,

      preConfirm: async (login) => {
        const withAnswers = login ? true : false;

        return axiosAuth(`/api/quizzes/${quizzId}/export`, {
          params: { answers: withAnswers },
          responseType: 'arraybuffer'
        }).then(response => {
          // 1. Trích xuất tên file
          const contentDisposition = response.headers['content-disposition'] as string;
          const filenameMatch = contentDisposition && contentDisposition.match(/filename="([^"]+)"/i);
          const filename = filenameMatch && filenameMatch[1] ? filenameMatch[1] : `quiz-${quizzId}.pdf`;

          // 2. Tạo Blob
          const blob = new Blob([response.data], { type: 'application/pdf' });

          // 3. Cập nhật State và mở Preview
          setPdfBlob(blob);
          setCurrentFilename(filename);
          setShowPreview(true);

          return "success";
        }).catch(error => {
          console.error("Lỗi khi xuất quiz:", error);
          toast.error("Xuất quiz thất bại!", { position: "bottom-right" });
          return false;
        });
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.close();
      }
    });
  };


  // Hàm đóng preview và giải phóng Blob
  const handleClosePreview = useCallback(() => {
    setShowPreview(false);
    setPdfBlob(null);
  }, []);

  // Hàm tải xuống
  const handleDownload = useCallback(() => {
    if (pdfBlob) {
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', currentFilename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url); // Giải phóng URL tạm thời

      handleClosePreview();
    }
  }, [pdfBlob, currentFilename, handleClosePreview]);


  const columns: ConfigColumns[] = [
    { data: '_id', visible: false, },
    { data: 'title', title: "Tên quiz", className: "text-lg font-semibold text-gray-800 dark:text-white/90" },
    {
      data: 'settings.totalQuestions', title: "Tổng số câu hỏi", className: "text-lg font-semibold text-gray-800 dark:text-white/90",
      width: '200px',

    },
    {
      data: '_id',
      // ... (width, className, orderable, searchable giữ nguyên) ...
      width: '350px',
      createdCell: function (cell, data, row) {
        hydrateRoot(
          cell,
          <div className="flex items-center gap-5">
            <Button size="sm" variant="primary" onClick={() => {
              push(`/quizzs/${data}`)
            }}>
              Xem
            </Button>

            <Button size="sm" variant="primary" className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onClick={async () => {
              Swal.fire({
                title: "Bạn có chắc muốn xoá?",
                html: "Thao tác này không thể hoàn tác",
                icon: "warning",
                showConfirmButton: true,
                showDenyButton: true,
                showCancelButton: false,
                allowOutsideClick: false,
                timerProgressBar: false,
                allowEscapeKey: false,
                confirmButtonText: 'Xác nhận',
                denyButtonText: 'Huỷ',


              }).then(async (result) => {
                /* Read more about isConfirmed, isDenied below */
                if (result.isConfirmed) {
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
                  const rs = await deleteQuizz(data)


                  Swal.close()
                  if (rs?.message === "Quiz deleted successfully") {
                    toast.success("Xoá quiz thành công!", {
                      position: "bottom-right",
                    })
                    refreshData()
                  } else {
                    toast.error("Xoá quiz thất bại!", {
                      position: "bottom-right",
                    })
                  }
                }
              })

            }}>
              Xoá
            </Button>

            <Button size="sm" variant="primary" className="bg-sky-400 hover:bg-sky-950 text-white font-bold py-2 px-4 rounded" onClick={async () => {
              // push(`/quizzs/${data}/take`)

              Swal.fire({
                title: "Vui lòng nhập thời gian bạn muốn làm bài (phút)",
                input: "number",
                inputLabel: "Thời gian làm bài",

                inputAttributes: {
                  min: 1, // Optional: HTML5 min attribute for initial client-side validation
                  step: 1 // Optional: HTML5 step attribute
                },
                inputPlaceholder: 'Nhập số phút',

                showCancelButton: true,
                cancelButtonText: "Huỷ",
                confirmButtonText: "Xác nhận",
                showLoaderOnConfirm: true,
                preConfirm: async (login) => {
                  console.log("🚀 ~ QuizzTables ~ login:", login)
                  const params = new URLSearchParams();
                  params.set("timeLimit", login);

                  push(`/quizzs/${data}/take?${params.toString()}`);

                  //             try {
                  //               const githubUrl = `
                  //   https://api.github.com/users/${login}
                  // `;
                  //               const response = await fetch(githubUrl);
                  //               if (!response.ok) {
                  //                 return Swal.showValidationMessage(`
                  //     ${JSON.stringify(await response.json())}
                  //   `);
                  //               }
                  //               return response.json();
                  //             } catch (error) {
                  //                (`
                  //   Request failed: ${error}
                  // `);
                  //             }
                },
                allowOutsideClick: () => !Swal.isLoading()
              }).then((result) => {
                // if (result.isConfirmed) {
                //   Swal.fire({
                //     title: `${result.value.login}'s avatar`,
                //     imageUrl: result.value.avatar_url
                //   });
                // }
              });
            }}>
              Làm bài
            </Button>

            <Button
              size="sm"
              variant="primary"
              className="bg-neutral-secondary-medium hover:bg-neutral-tertiary-medium hover:text-heading text-white font-bold py-2 px-4 rounded"
              onClick={() => {
                handlePrintQuizz(data)
              }}
            >
              In
            </Button>

          </div>
        );
      },
      className: "text-lg font-semibold text-gray-800 dark:text-white/90",
      orderable: false,
      searchable: false
    }
  ];

  return (

    <>
      {/* ... (ComponentCard Chức năng & Danh sách giữ nguyên) ... */}
      <ComponentCard title="Chức năng">
        <CreateQuizzButton onCreateSuccess={() => {
          refreshData()
        }} />
      </ComponentCard>
      <ComponentCard title="Danh sách">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[1102px] p-8">
              <DataTable
                data={tableData}
                options={{
                  order: [],
                  language: {
                    search: '_INPUT_',
                    searchPlaceholder: 'Nhập từ khoá muốn tìm kiếm',
                    paginate: {
                      first: 'Đầu',
                      last: 'Cuối',
                      next: "Tiếp theo",
                      previous: 'Về trước'
                    },
                    lengthMenu: 'Hiển thị _MENU_ dòng dữ liệu',
                    emptyTable: 'Không có dữ liệu',
                    info: 'Hiển thị từ _START_ đến _END_ trên _TOTAL_ dữ liệu',
                    infoEmpty: 'Không có dữ liệu',
                  }
                }}

                className="overflow-hidden  rounded-xl  bg-white  dark:bg-white/[0.03]" columns={columns}>
              </DataTable>
            </div>
          </div>
        </div>
      </ComponentCard>

      {/* --- PREVIEW PDF MODAL --- */}

      <Modal isOpen={showPreview && !!pdfBlob} onClose={handleClosePreview} isFullscreen >
        <div className="fixed top-0 left-0 flex flex-col justify-between w-full h-screen p-6 overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900 lg:p-10">
          <div
            className=""
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Xem trước PDF</h2>

            <div className="flex justify-center mb-4 gap-4">
              <Button size="sm" variant="primary" onClick={handleDownload}>
                Tải xuống
              </Button>
              <Button size="sm" variant="secondary" onClick={handleClosePreview}>
                Đóng
              </Button>
            </div>

            {/* Sử dụng PDF Viewer */}
            <div className="border p-2 rounded" >
              {pdfBlob && (
                <div className="h-full w-full bg-white shadow-lg rounded-lg overflow-hidden">
                  {/* Gọi Component PDFViewer mới, truyền URL blob vào */}
                  <PDFViewer fileUrl={window.URL.createObjectURL(pdfBlob)} />
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

    </>
  );
}