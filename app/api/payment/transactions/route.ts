import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const transactions = await db.addFunds.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
          invoiceId: true,
          amount: true,
          status: true,
          paymentGateway: true,
          paymentMethod: true,
          transactionId: true,
          currency: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
  
      if (!Array.isArray(transactions)) {
        console.error("Transactions is not an array:", transactions);
        return NextResponse.json({ error: "Invalid data format" }, { status: 500 });
      }
  
      return NextResponse.json(transactions);
    } catch (dbError) {
      console.error("Database error fetching transactions:", dbError);
      
      return NextResponse.json([], { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions", details: String(error) },
      { status: 500 }
    );
  }
}
