"use client";

import React, { use, useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import Image from "next/image";
import DataTable, { TableColumn } from 'react-data-table-component';
import axiosInstance from "@/utils/axios";
import ComponentCard from "../common/ComponentCard";
import { BoxIcon } from "@/icons";
import Button from "../ui/button/Button";

const getListData = async () => {
  const rs = await axiosInstance(`/api/quizzes`, {
    method: "GET",
  })
  console.log(rs.data)
  return rs.data
}

export default function QuizzTables2() {
  const [tableData, setTableData] = useState([
  ]);
  useEffect(() => {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: TableColumn<any>[] = [
    // { data: '_id', visible: false, },
    // { data: 'title', title: "Tên quizz" },
    // { data: 'settings.numQuestions', title: "Số câu hỏi" },
    // { data: 'settings.difficulty', title: "Độ khó" },
    // { data: "quizzAttemptsCount", title: "Số bài quizz đã thực hiện" },
    // {
    //   data: null, // No data source for this column, we'll render it manually
    //   // defaultContent: <Button size="sm" variant="primary" endIcon={<BoxIcon />}>
    //   //   Tạo quizz mới
    //   // </Button>, // Default button HTML

    //   orderable: false, // Prevent sorting on this column
    //   searchable: false // Prevent searching on this column
    // }
    {
      name: 'Tên quizz',
      selector: row => row.title,
      sortable: true,
    },
    {
      name: 'Số câu hỏi',
      selector: row => row['settings.numQuestions'],
      sortable: true,
    },
    {
      name: 'Độ khó',
      selector: row => row['settings.difficulty'],
      sortable: true,
    },
    {
      name: 'Số bài quizz đã thực hiện',
      selector: row => row.quizzAttemptsCount,
      sortable: true,
    },
    {
      name: 'Chức năng',
      selector: row => row.id,
      sortable: false,
      cell: () => {
        return <Button size="sm" variant="primary" endIcon={<BoxIcon />}>
          Tạo quizz mới
        </Button>
      }
    },
  ];

  return (

    <>
      <ComponentCard title="Chức năng">
        <Button size="sm" variant="primary" endIcon={<BoxIcon />}>
          Tạo quizz mới
        </Button>
      </ComponentCard>
      <ComponentCard title="Danh sách">

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">



          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[1102px] p-8">
              <DataTable data={tableData} className="display dark" columns={columns} paginationPerPage={1}>
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
