import { Table } from "@/components/ui/table";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formattedDateTime, statusLabels, toTitleCase } from "@/lib/utils";
import TransactionTableHeader from "./TransactionHeader";
import EmptyTable from "../../ui/EmptyTable";
import TransactionAction from "./TransactionAction";
import { OrderView } from "@/lib/interfaces";
import { useSession } from "next-auth/react";

export default function TransactionTable({
  transactions,
  isLoading,
}: {
  transactions: OrderView[];
  isLoading: boolean;
}) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  if (isLoading) {
    return <div className="p-4">Loading transactions...</div>;
  }

  return (
    <>
      {transactions.length === 0 ? (
        <EmptyTable content="No Transaction Found" />
      ) : (
        <Table>
          <TransactionTableHeader userRole={userRole} />
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={`${transaction.type}-${transaction.id}`}>
                <TableCell>{`${transaction.id}`}</TableCell>
                <TableCell>
                  {toTitleCase(
                    transaction.patientDetails?.patientName
                      ? transaction.patientDetails?.patientName
                      : transaction?.customer
                        ? transaction?.customer
                        : "Unknown",
                  )}
                </TableCell>
                <TableCell>
                  {formattedDateTime(transaction.createdAt)}
                </TableCell>
                <TableCell>{transaction.quantity}</TableCell>
                <TableCell>{`₱${transaction.paymentDetails?.[0]?.amountDue?.toFixed(2) ?? "0.00"}`}</TableCell>
                <TableCell>{transaction.source}</TableCell>
                <TableCell>
                  {transaction.type === "REGULAR"
                    ? "Regular"
                    : transaction.type === "EMERGENCY"
                      ? "Pay Later"
                      : "N/A"}
                </TableCell>
                <TableCell>{statusLabels[transaction.status]}</TableCell>
                <TableCell className="w-[120px]" align="right">
                  <TransactionAction transaction={transaction} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
