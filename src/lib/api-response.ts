import { NextResponse } from "next/server";

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: string;
};

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json<ApiError>({ success: false, error: message }, { status });
}
