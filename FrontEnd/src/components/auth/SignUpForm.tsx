"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { validateEmail } from "@/utils/commom";
import Swal from "sweetalert2";

// Định nghĩa các quy tắc kiểm tra mật khẩu
const passwordRules = [
  {
    id: 1,
    label: "Mật khẩu bắt buộc",
    check: (pwd: string) => pwd.length > 0,
  },
  {
    id: 2,
    label: "Tối thiểu 8 ký tự",
    check: (pwd: string) => pwd.length >= 8,
  },
  {
    id: 3,
    label: "Không chứa khoảng trắng",
    check: (pwd: string) => !/\s/.test(pwd) && pwd.length > 0,
  },
  {
    id: 4,
    label: "Ít nhất 1 chữ thường",
    check: (pwd: string) => /[a-z]/.test(pwd),
  },
  {
    id: 5,
    label: "Ít nhất 1 chữ hoa",
    check: (pwd: string) => /[A-Z]/.test(pwd),
  },
  {
    id: 6,
    label: "Ít nhất 1 số",
    check: (pwd: string) => /[0-9]/.test(pwd),
  },
];

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { push } = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordcorrect: '',
  });

  // State để theo dõi xem người dùng đã bắt đầu nhập mật khẩu chưa (để tránh hiện lỗi ngay từ đầu)
  const [isPasswordTouched, setIsPasswordTouched] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (name === 'password') {
      setIsPasswordTouched(true);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Kiểm tra điều kiện mật khẩu trước khi gửi
      const isPasswordValid = passwordRules.every(rule => rule.check(formData.password));

      if (!isPasswordValid) {
        return toast.error('Mật khẩu không thỏa mãn các điều kiện bảo mật!', {
          position: "top-right",
          autoClose: 3000,
        });
      }

      if (formData.password !== formData.passwordcorrect) {
        return toast.error('Mật khẩu xác nhận không khớp!', {
          position: "top-right",
          autoClose: 5000,
        });
      }

      Swal.fire({
        title: "Đang đăng ký",
        html: "Vui lòng đợi trong giây lát!",
        icon: "info",
        showConfirmButton: false,
        showDenyButton: false,
        showCancelButton: false,
        allowOutsideClick: false,
        timerProgressBar: true,
        allowEscapeKey: false
      })

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      Swal.close()

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const rs = await response.json()

      if (rs.error) {
        throw new Error(rs.error)
      }

      console.log("Registration Successful", response);
      toast.success("Đăng ký thành công");
      push('/signin')
    } catch (error: any) {
      Swal.close()
      console.error("Registration Failed:", error);
      toast.error(`Đăng ký thất bại : ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Đăng nhập
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Đăng ký
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nhập email và mật khẩu để đăng ký tài khoản
            </p>
          </div>
          <div>
            <form onSubmit={onSubmit}>
              <div className="space-y-5">
                <div className="sm:col-span-1">
                  <Label>
                    Họ và tên<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    maxLength={50}
                    minLength={2}
                    required
                    placeholder="Nhập họ và tên"
                    value={formData.name} onChange={handleChange}
                  />
                </div>
                {/* */}
                <div>
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Nhập email"
                    maxLength={50}
                    minLength={5}
                    error={validateEmail(formData.email) === false && formData.email.length > 0}
                    required
                    value={formData.email} onChange={handleChange}
                  />
                </div>

                {/* */}
                <div>
                  <Label>
                    Mật khẩu<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Nhập mật khẩu"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password} onChange={handleChange}
                      required
                      maxLength={50}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>

                  {/* Phần hiển thị điều kiện mật khẩu */}
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-500 mb-2 dark:text-gray-400">
                      Yêu cầu mật khẩu:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-2">
                      {passwordRules.map((rule) => {
                        const isValid = rule.check(formData.password);
                        const isInactive = !isPasswordTouched && !isValid;

                        return (
                          <li
                            key={rule.id}
                            className={`text-xs flex items-center gap-1.5 transition-colors duration-200 ${isValid
                                ? "text-green-600 dark:text-green-500"
                                : isInactive
                                  ? "text-gray-400"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                          >
                            <span className={`w-3 h-3 flex items-center justify-center rounded-full text-[8px] ${isValid
                                ? "bg-green-100 text-green-600 dark:bg-green-500/20"
                                : "bg-gray-100 text-gray-400 dark:bg-white/10"
                              }`}>
                              {isValid ? "✓" : "•"}
                            </span>
                            {rule.label}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>

                <div>
                  <Label>
                    Nhập lại mật khẩu<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Nhập lại mật khẩu"
                      name="passwordcorrect"
                      type={showPassword ? "text" : "password"}
                      value={formData.passwordcorrect} onChange={handleChange}
                      required
                      maxLength={50}
                      // Thêm visual feedback nếu khớp hoặc không khớp khi đã nhập
                      error={formData.passwordcorrect.length > 0 && formData.password !== formData.passwordcorrect}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                  {/* Thông báo lỗi inline cho xác nhận mật khẩu */}
                  {formData.passwordcorrect.length > 0 && formData.password !== formData.passwordcorrect && (
                    <p className="mt-1 text-xs text-error-500">Mật khẩu xác nhận chưa khớp.</p>
                  )}
                </div>

                {/* */}
                <div>
                  <button
                    // Vô hiệu hóa nút nếu form chưa hợp lệ (tuỳ chọn, nhưng tốt cho UX)
                    // disabled={!passwordRules.every(r => r.check(formData.password))}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Đăng ký
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}