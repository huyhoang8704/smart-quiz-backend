"use client";
import React, { useCallback, useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import 'datatables.net-dt/css/dataTables.dataTables.css';
// const DataTable = dynamic(() => import('datatables.net-react'), { ssr: false });
const DataTable = dynamic(
  async () => {
    import(`datatables.net-buttons-dt`);
    const dtReact = import('datatables.net-react');
    const dtNet = import(`datatables.net-dt`);

    // import(`datatables.net-buttons/js/buttons.colVis.mjs`);
    // import(`datatables.net-buttons-dt`);
    // import(`datatables.net-buttons-dt`);
    // import(`datatables.net-buttons-dt`);

    const [reactMod, dtNetMod] = await Promise.all([dtReact, dtNet]);

    reactMod.default.use(dtNetMod.default);
    return reactMod.default;
  },
  { ssr: false }
);
// import DataTable from 'datatables.net-react';
import { ConfigColumns } from 'datatables.net-dt';
// dynamic(() => import('datatables.net-buttons-dt'), { ssr: false })
// import jszip from 'jszip';
// import pdfmake from 'pdfmake';
// import 'datatables.net-buttons-dt';
// import 'datatables.net-buttons/js/buttons.colVis.mjs';
// import 'datatables.net-buttons/js/buttons.html5.mjs';
// import 'datatables.net-buttons/js/buttons.print.mjs';
// import 'datatables.net-colreorder-dt';
// import 'datatables.net-columncontrol-dt';

// import 'datatables.net-searchbuilder-dt';
// import 'datatables.net-select-dt';

import axiosInstance from "@/utils/axios";
import Button from "../ui/button/Button";

import ComponentCard from "../common/ComponentCard";
import { hydrateRoot } from "react-dom/client";

import { useRouter } from "next/navigation";
import CreateQuizzButton from "../quizz/CreateQuizzButton";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

import { useAxiosAuth } from "@/hooks/useAxiosAuth";

// DataTablesCore.Buttons.jszip(jszip);
// DataTablesCore.Buttons.pdfMake(pdfmake);
// if (typeof window !== 'undefined') {

//   // eslint-disable-next-line react-hooks/rules-of-hooks
//   DataTable.use(DataTablesCore);
// }



export default function QuizzTables() {
  const { axiosInstance: axiosAuth, status } = useAxiosAuth(); // <--- Lấy instance đã có token
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

  const columns: ConfigColumns[] = [
    { data: '_id', visible: false, },
    { data: 'title', title: "Tên quizz", className: "text-lg font-semibold text-gray-800 dark:text-white/90" },
    { data: 'settings.totalQuestions', title: "Tổng số câu hỏi", className: "text-lg font-semibold text-gray-800 dark:text-white/90" },
    // { data: 'settings.difficulty', title: "Độ khó" },
    // { data: "quizzAttemptsCount", title: "Số bài quizz đã thực hiện", className: "text-lg font-semibold text-gray-800 dark:text-white/90" },
    {
      data: '_id', // No data source for this column, we'll render it manually
      // defaultContent: <Button size="sm" variant="primary" endIcon={<BoxIcon />}>
      //   Tạo quizz mới
      // </Button>, // Default button HTML
      // render: () = '',
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
                    toast.success("Xoá quizz thành công!", {
                      position: "bottom-right",
                    })
                    refreshData()
                  } else {
                    toast.error("Xoá quizz thất bại!", {
                      position: "bottom-right",
                    })
                  }
                }
              })

            }}>
              Xoá
            </Button>

            <Button size="sm" variant="primary" className="bg-sky-400 hover:bg-sky-950 text-white font-bold py-2 px-4 rounded" onClick={async () => {
              push(`/quizzs/${data}/take`)
            }}>
              Làm bài
            </Button>
          </div>
        );
      },
      className: "text-lg font-semibold text-gray-800 dark:text-white/90",
      orderable: false, // Prevent sorting on this column
      searchable: false // Prevent searching on this column
    }
  ];

  return (

    <>
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
                    infoEmpty: 'Không có dữ liệu', // Change this string


                  }
                }}

                className="overflow-hidden  rounded-xl  bg-white  dark:bg-white/[0.03]" columns={columns}>
              </DataTable>
            </div>
          </div>
        </div>
      </ComponentCard>
    </>
  );
}
