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
import { ConfigColumns } from 'datatables.net-dt';

import Button from "../ui/button/Button";

import ComponentCard from "../common/ComponentCard";
import { hydrateRoot } from "react-dom/client";

import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";



export default function QuizzTablesAttempts() {
  const { axiosInstance, status } = useAxiosAuth(); // <--- Lấy instance đã có token

  const getListData = useCallback(async () => {
    const rs = await axiosInstance(`/api/quizzes/history`, {
      method: "GET",
    })
    return rs.data
  }, [axiosInstance])

  const [tableData, setTableData] = useState([
  ]);

  const [loading, setLoading] = useState(false);

  const { push } = useRouter()

  const refreshData = useCallback(() => {
    setLoading(true)
    getListData().then(async x => {
      setTableData(x)
      setLoading(false)
    }).catch(e => {
      console.log("🚀 ~ QuizzTablesAttempts ~ e:", e)
      setLoading(false)
    })
  }, [axiosInstance, getListData])



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
    { data: 'quizTitle', title: "Tên quiz", className: "text-lg font-semibold text-gray-800 dark:text-white/90" },
    { data: 'totalQuestions', title: "Tổng số câu hỏi", className: "text-lg font-semibold text-gray-800 dark:text-white/90" },
    // { data: 'settings.difficulty', title: "Độ khó" },
    { data: "attemptsCount", title: "Số lần đã thực hiện", className: "text-lg font-semibold text-gray-800 dark:text-white/90" },
    {
      data: '_id', // No data source for this column, we'll render it manually
      // defaultContent: <Button size="sm" variant="primary" endIcon={<BoxIcon />}>
      //   Tạo quiz mới
      // </Button>, // Default button HTML
      // render: () = '',
      createdCell: function (cell, data, row) {
        hydrateRoot(
          cell,
          <div className="flex items-center gap-5">
            <Button size="sm" variant="primary" onClick={() => {
              push(`/quizzs/${data}/attempts`)
            }}>
              Xem lại
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
