
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { jwtVerify, SignJWT } from "jose";

// Optional: Define custom JWT encode/decode logic
const jwt = {
    async encode({ token, secret }) {
        return new SignJWT(token)
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("2h") // Adjust expiration as needed
            .sign(new TextEncoder().encode(secret));
    },
    async decode({ token, secret }) {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
        return payload;
    },
};

export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth({
    pages: {
        signIn: "/signin",
        error: "/error",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            type: 'credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // This is where you would call your backend API to validate credentials
                const response = await fetch("http://localhost:4000/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(credentials),
                });
                console.log("🚀 ~ authorize ~ response:", response)

                if (!response.ok) {
                    return null; // Return null if login fails
                }

                const data = await response.json();
                const { user, token } = data;

                // The user object returned here will be available in the JWT and session callbacks.
                // It should contain at least an `id`.
                return {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    name: user.name,
                    backendToken: token, // Store your custom JWT token
                };
            },
        }),
    ],
    // JWT session strategy is required for the credentials provider.
    session: {
        strategy: "jwt",
        maxAge: 60 * 60 * 2, // 2 hours
    },
    // Use the custom JWT functions.
    jwt,
    callbacks: {
        // The `jwt` callback is called whenever a JWT token is created or updated.
        async jwt({ token, user }) {
            if (user) {
                // The `user` object is only present on sign-in.
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.role = user.role;
                token.backendToken = user.backendToken; // Add your custom backend token to the JWT
            }
            return token;
        },
        // The `session` callback is called whenever a session is accessed.
        async session({ session, token, ...args }) {
            if (token) {
                // The `token` object is the JWT token from the jwt callback.
                session.user.id = token.id;
                session.user.email = token.email;
                session.user.name = token.name;
                session.user.role = token.role;
                session.user.backendToken = token.backendToken; // Add the custom token to the session
            }
            return session;
        },
    },
});
