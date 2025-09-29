import { NextResponse } from "next/server";


export async function POST(request: Request) {
    try {
        const dataReq = await request.json();

        const response = await fetch(`${process.env.API_BASE_URL}/api/auth/register/student`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataReq),
        });
        return NextResponse.json(await response.json());
    } catch (e) {
        console.log({ e });
        return NextResponse.json({ message: "fail" });
    }

    return NextResponse.json({ message: "success" });
}