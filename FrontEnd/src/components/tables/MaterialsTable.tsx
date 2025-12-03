"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import 'datatables.net-dt/css/dataTables.dataTables.css';

// const Swal = dynamic(() => import('sweetalert2'), { ssr: false });
// const withReactContent = dynamic(() => import('sweetalert2-react-content'), { ssr: false });

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

import Button from "../ui/button/Button";

import ComponentCard from "../common/ComponentCard";
import { hydrateRoot } from "react-dom/client";
import { useRouter } from "next/navigation";
import UploadMaterial from "../materials/UploadMaterial";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import axios from "axios";
import { useAxiosAuth } from "@/hooks/useAxiosAuth";




export default function MaterialsTable() {
  const [tableData, setTableData] = useState<{
    _id: string
    ownerId: string
    title: string
    type: string
    filePath: string
    processedContent: string
    createdAt: string
    updatedAt: string
    __v: number
  }[]>([
  ]);

  const { push } = useRouter()
  const { axiosInstance, status } = useAxiosAuth(); // <--- Lấy instance đã có token


  const getListData = useCallback(async () => {
    const rs = await axiosInstance(`/api/materials`, {
      method: "GET",
    })
    
    return rs.data
  }, [axiosInstance])

  useEffect(() => {
    if (status === "authenticated") {

      getListData().then(async x => {
        setTableData(x)
      })
    }
  }, [getListData, status])

  const deleteFile = async (id: string) => {
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
    const rs = await axiosInstance(`/api/materials/${id}`, {
      method: "DELETE",
    })

    
    Swal.close()
    if (rs?.data?.message === "Material deleted successfully") {
      toast.success("Xoá file thành công!", {
        position: "bottom-right",
      })
      getListData().then(async x => {
        setTableData(x)
      })
    } else {
      toast.error("Xoá file thất bại!", {
        position: "bottom-right",
      })
    }
    return rs.data
  }

  const openInNewTab = (url) => {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
    if (newWindow) newWindow.opener = null
  }

  const downloadFile = async (id: string) => {
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
    const rs = await axiosInstance(`/api/materials/${id}`, {
      method: "GET",
    }).catch(() => {
      Swal.close()
    })
    try {


      if (rs?.data?.url) {
        if (rs.data.type === 'video') {
          openInNewTab(rs?.data?.url)
        } else {
          const downloadData = await axios({
            url: rs?.data?.url,
            method: "GET",
            responseType: "blob" // important
          })

          const url = window.URL.createObjectURL(new Blob([downloadData.data]));

          const link = document.createElement('a');
          link.href = url;
          link.setAttribute(
            'download',
            (rs.data.filePath.split('/') as string[]).pop(),
          );

          // Append to html link element page
          document.body.appendChild(link);

          // Start download
          link.click();

          // Clean up and remove the link
          link.parentNode.removeChild(link);
        }

      }
      Swal.close()

    } catch (error) {
      console.log("🚀 ~ downloadFile ~ error:", error)
      Swal.close()

    }

  }



  const columns: ConfigColumns[] = [
    { data: '_id', visible: false, },
    { data: 'title', title: "Tên file", className: 'dt-left ' },
    { data: 'type', title: "Loại file" },
    { data: 'processedContent', title: "Mô tả" },
    {
      data: '_id', // No data source for this column, we'll render it manually
      // defaultContent: <Button size="sm" variant="primary" endIcon={<BoxIcon />}>
      //   Tạo quiz mới
      // </Button>, // Default button HTML
      // render: () = '',
      className: 'dt-right',
      createdCell: function (cell, data, row) {
        hydrateRoot(
          cell,
          <div className="flex items-center gap-5 justify-end">
            {/* <Button size="sm" variant="primary" onClick={() => {
              push(`/quizzs/${data}`)
            }}>
              Tải
            </Button> */}
            <Button size="sm" variant="primary" className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onClick={() => {

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
                  await deleteFile(data)
                }
              })
            }}>
              Xoá
            </Button>

            <Button size="sm" variant="primary" className="hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onClick={() => {
              downloadFile(data)
            }}>
              Tải
            </Button>
          </div>
        );
      },
      orderable: false, // Prevent sorting on this column
      searchable: false // Prevent searching on this column
    }
  ];

  return (

    <>
      <ComponentCard title="Chức năng">
        <UploadMaterial onSuccess={() => {
          getListData().then(async x => {
            setTableData(x)
          })
        }} />
      </ComponentCard>
      <ComponentCard title="Danh sách">

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">



          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[1102px] p-8">
              <DataTable data={tableData} className="overflow-hidden  rounded-xl  bg-white  dark:bg-white/[0.03]" columns={columns}
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
                }}>
                {/* <thead>
              <tr>
                <th>Tên quiz</th>
                <th>Số câu hỏi</th>
                <th>Độ khó</th>
                <th>Số bài quiz đã thực hiện</th>
              </tr>
            </thead> */}
              </DataTable>
            </div>
          </div>
        </div>
      </ComponentCard>
    </>
  );
}
