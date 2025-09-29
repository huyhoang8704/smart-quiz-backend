"use client";

import React, { use, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Image from "next/image";

import jszip from 'jszip';
import pdfmake from 'pdfmake';
import DataTable from 'datatables.net-react';
import DataTablesCore, { ConfigColumns } from 'datatables.net-dt';
import 'datatables.net-buttons-dt';
import 'datatables.net-buttons/js/buttons.colVis.mjs';
import 'datatables.net-buttons/js/buttons.html5.mjs';
import 'datatables.net-buttons/js/buttons.print.mjs';
import 'datatables.net-colreorder-dt';
import 'datatables.net-columncontrol-dt';
import DateTime from 'datatables.net-datetime';
import 'datatables.net-searchbuilder-dt';
import 'datatables.net-select-dt';
import { useSession } from "next-auth/react";
import axiosInstance from "@/utils/axios";
import Button from "../ui/button/Button";
import { BoxIcon } from "@/icons";
import ComponentCard from "../common/ComponentCard";
import { hydrateRoot } from "react-dom/client";
import QuizzView from "./QuizzView";
import { useRouter } from "next/navigation";
import UploadMaterial from "../materials/UploadMaterial";

DataTablesCore.Buttons.jszip(jszip);
DataTablesCore.Buttons.pdfMake(pdfmake);
DataTable.use(DataTablesCore);

const getListData = async () => {
  const rs = await axiosInstance(`/api/materials`, {
    method: "GET",
  })
  console.log(rs.data)
  return rs.data
}

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
  useEffect(() => {
    getListData().then(async x => {
      setTableData(x)
    })
  }, [])

  const columns: ConfigColumns[] = [
    { data: '_id', visible: false, },
    { data: 'title', title: "Tên file" },
    { data: 'type', title: "Loại file" },
    // {
    //   data: '_id', // No data source for this column, we'll render it manually
    //   // defaultContent: <Button size="sm" variant="primary" endIcon={<BoxIcon />}>
    //   //   Tạo quizz mới
    //   // </Button>, // Default button HTML
    //   // render: () = '',
    //   createdCell: function (cell, data, row) {
    //     hydrateRoot(
    //       cell,
    //       <Button size="sm" variant="primary" onClick={() => {
    //         push(`/quizzs/${data}`)
    //       }}>
    //         Xem
    //       </Button>
    //     );
    //   },
    //   orderable: false, // Prevent sorting on this column
    //   searchable: false // Prevent searching on this column
    // }
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
              <DataTable data={tableData} className="overflow-hidden  rounded-xl  bg-white  dark:bg-white/[0.03]" columns={columns}>
                {/* <thead>
              <tr>
                <th>Tên quizz</th>
                <th>Số câu hỏi</th>
                <th>Độ khó</th>
                <th>Số bài quizz đã thực hiện</th>
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
