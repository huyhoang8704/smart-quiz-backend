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
// import DataTablesCore, { ConfigColumns } from 'datatables.net-dt';
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

// DataTablesCore.Buttons.jszip(jszip);
// DataTablesCore.Buttons.pdfMake(pdfmake);
// if (typeof window !== 'undefined') {

//   // eslint-disable-next-line react-hooks/rules-of-hooks
//   DataTable.use(DataTablesCore);
// }



export default function QuizzTables() {

  const getListData = useCallback(async () => {
    const rs = await axiosInstance(`/api/quizzes`, {
      method: "GET",
    })
    console.log(rs.data)
    return rs.data
  }, [])

  const [tableData, setTableData] = useState([
  ]);

  const { push } = useRouter()

  const refreshData = useCallback(() => {
    getListData().then(async x => {
      // setTableData(x.map(datas => {
      //   return [datas.title, datas.settings.numQuestions, datas.settings.difficulty]
      // }))

      // setTableData(x)

      for (let i = 0; i < x.length; i++) {
        const element = x[i];
        const rrr = await axiosInstance(`/api/quizzes/${element._id}/attempts`)
        console.log("🚀 ~ QuizzTables ~ rrr:", rrr)
        x[i].quizzAttemptsCount = rrr.data.length
      }
      setTableData(x)
    })
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const columns: ConfigColumns[] = [
    { data: '_id', visible: false, },
    { data: 'title', title: "Tên quizz" },
    { data: 'settings.totalQuestions', title: "Tổng số câu hỏi" },
    // { data: 'settings.difficulty', title: "Độ khó" },
    { data: "quizzAttemptsCount", title: "Số bài quizz đã thực hiện" },
    {
      data: '_id', // No data source for this column, we'll render it manually
      // defaultContent: <Button size="sm" variant="primary" endIcon={<BoxIcon />}>
      //   Tạo quizz mới
      // </Button>, // Default button HTML
      // render: () = '',
      createdCell: function (cell, data, row) {
        hydrateRoot(
          cell,
          <Button size="sm" variant="primary" onClick={() => {
            push(`/quizzs/${data}`)
          }}>
            Xem
          </Button>
        );
      },
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
              <DataTable data={tableData} className="overflow-hidden  rounded-xl  bg-white  dark:bg-white/[0.03]" columns={columns} />
            </div>
          </div>
        </div>
      </ComponentCard>
    </>
  );
}
