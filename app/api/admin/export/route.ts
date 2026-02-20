import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Registration from '@/models/Registration';
import ExcelJS from 'exceljs';
import Papa from 'papaparse';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const sessionId = searchParams.get('sessionId');

    await dbConnect();

    // Build query filter
    const query = sessionId ? { sessionId } : {};
    const registrations = await Registration.find(query).populate('sessionId');

    // Format data for export
    const data = registrations.map((reg: any) => ({
      'Full Name': reg.fullName,
      'Phone Number': reg.phoneNumber,
      'Grade': reg.grade,
      'Session': reg.sessionId.name,
      'Session Date': new Date(reg.sessionId.date).toLocaleDateString(),
      'Session Time': reg.sessionId.time,
      'Registered At': new Date(reg.createdAt).toLocaleString(),
    }));

    if (format === 'excel') {
      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Registrations');

      // Add headers
      worksheet.columns = [
        { header: 'Full Name', key: 'Full Name', width: 25 },
        { header: 'Phone Number', key: 'Phone Number', width: 20 },
        { header: 'Grade', key: 'Grade', width: 10 },
        { header: 'Session', key: 'Session', width: 30 },
        { header: 'Session Date', key: 'Session Date', width: 15 },
        { header: 'Session Time', key: 'Session Time', width: 15 },
        { header: 'Registered At', key: 'Registered At', width: 20 },
      ];

      // Add rows
      data.forEach(row => worksheet.addRow(row));

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="registrations-${Date.now()}.xlsx"`,
        },
      });
    } else {
      // Generate CSV
      const csv = Papa.unparse(data);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="registrations-${Date.now()}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengekspor data' },
      { status: 500 }
    );
  }
}
