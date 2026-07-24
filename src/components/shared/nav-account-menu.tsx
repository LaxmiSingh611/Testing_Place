"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NavAccountMenu({
  isSignedIn,
  userName,
  isAdmin,
  isSeller,
}: {
  isSignedIn: boolean;
  userName: string | null;
  isAdmin: boolean;
  isSeller: boolean;
}) {
  if (!isSignedIn) {
    return (
      <Link href="/sign-in" className="flex items-center gap-1 text-sm font-medium">
        <UserRound className="size-5" />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium outline-none">
        <UserRound className="size-5" />
        <span className="hidden sm:inline">{userName ?? "Account"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{userName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/account" />}>Profile</DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account/orders" />}>Orders</DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account/addresses" />}>Addresses</DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem render={<Link href="/admin" />}>Admin dashboard</DropdownMenuItem>
        )}
        <DropdownMenuItem render={<Link href={isSeller ? "/seller" : "/sell"} />}>
          {isSeller ? "Seller Dashboard" : "Sell on bazaar.in"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
