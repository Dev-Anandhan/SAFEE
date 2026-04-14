"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    auth,
    googleProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    User,
} from "@/lib/firebase";

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsub();
    }, []);

    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err) {
            console.error("Login failed:", err);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
    };

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link href="/" className="navbar-brand">
                    <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="28" height="28" rx="8" fill="url(#brand-grad)" />
                        <path
                            d="M8 14l4 4 8-8"
                            stroke="#fff"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <defs>
                            <linearGradient id="brand-grad" x1="0" y1="0" x2="28" y2="28">
                                <stop stopColor="#6c63ff" />
                                <stop offset="1" stopColor="#00d4aa" />
                            </linearGradient>
                        </defs>
                    </svg>
                    SAFEE
                </Link>

                <div className="navbar-user">
                    {user ? (
                        <>
                            <span className="navbar-email">{user.email}</span>
                            <Link href="/safe">
                                <button className="btn btn-primary btn-sm">Dashboard</button>
                            </Link>
                            <button className="btn btn-danger btn-sm" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <button className="btn btn-primary btn-sm" onClick={handleLogin}>
                            Sign in with Google
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
