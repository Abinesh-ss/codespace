import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "@/src/lib/supabase";

/**
 * STRICT CORS
 */
function setCorsHeaders(res: NextResponse) {
  res.headers.set(
    "Access-Control-Allow-Origin",
    "https://codespace-f.vercel.app"
  );

  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  res.headers.set("Access-Control-Allow-Credentials", "true");

  return res;
}

/**
 * OPTIONS - Preflight
 */
export async function OPTIONS() {
  const res = new NextResponse(null, {
    status: 204,
  });

  return setCorsHeaders(res);
}

/**
 * POST - Login
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    /**
     * Validate Input
     */
    if (!email || !password) {
      return setCorsHeaders(
        NextResponse.json(
          {
            error: "Email and password required",
          },
          {
            status: 400,
          }
        )
      );
    }

    /**
     * Find User
     */
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return setCorsHeaders(
        NextResponse.json(
          {
            error: "Invalid credentials",
          },
          {
            status: 401,
          }
        )
      );
    }

    /**
     * Validate Password
     */
    const validPassword = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!validPassword) {
      return setCorsHeaders(
        NextResponse.json(
          {
            error: "Invalid credentials",
          },
          {
            status: 401,
          }
        )
      );
    }

    /**
     * Create JWT
     */
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    /**
     * Response
     */
    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          planStatus: user.planStatus,
        },
      },
      {
        status: 200,
      }
    );

    /**
     * Auth Cookie
     */
    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return setCorsHeaders(response);

  } catch (error) {
    console.error("Login Error:", error);

    return setCorsHeaders(
      NextResponse.json(
        {
          error: "Internal server error",
        },
        {
          status: 500,
        }
      )
    );
  }
}
