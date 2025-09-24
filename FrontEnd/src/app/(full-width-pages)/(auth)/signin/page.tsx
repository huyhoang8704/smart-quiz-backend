import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập | Quản lý dự án phần mềm - Tạo Quizz",
  description: "",
};

export default function SignIn() {
  return <SignInForm />;
}
