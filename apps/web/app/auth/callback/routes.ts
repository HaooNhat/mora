// import { NextRequest, NextResponse } from "next/server";
// import { createServerClient } from "@supabase/ssr";
//
// export async function GET(request: NextRequest) {
//   const { searchParams, origin } = new URL(request.url);
//   const code = searchParams.get("code");
//
//   if (!code) {
//     return NextResponse.redirect(`${origin}/login`);
//   }
//
//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.SUPABASE_SERVICE_ROLE_KEY!,
//   );
//
//   await supabase.auth.exchangeCodeForSession(code);
//
//   return NextResponse.redirect(`${origin}/`);
// }
