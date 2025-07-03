import jsPDF from 'jspdf';
import { CertificateRequest, User, School } from '../types';

export const generateCertificatePDF = (
  request: CertificateRequest,
 classes: { id: string; name: string }[], // Add classes as an argument
  student: User,
  school: School,
  certificateNumber: string
): string => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Add border
  pdf.setLineWidth(2);
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
  
  // Add inner border
  pdf.setLineWidth(0.5);
  pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);

  // School Header
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  const schoolNameWidth = pdf.getTextWidth(school.name);
  pdf.text(school.name, (pageWidth - schoolNameWidth) / 2, 40);

  // School Address
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const addressWidth = pdf.getTextWidth(school.address);
  pdf.text(school.address, (pageWidth - addressWidth) / 2, 50);

  // Phone and Email
  const contactInfo = `Phone: ${school.phone} | Email: ${school.email}`;
  const contactWidth = pdf.getTextWidth(contactInfo);
  pdf.text(contactInfo, (pageWidth - contactWidth) / 2, 58);

  // Certificate Title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  const certificateTitle = getCertificateTitle(request.certificateType);
  const titleWidth = pdf.getTextWidth(certificateTitle);
  pdf.text(certificateTitle, (pageWidth - titleWidth) / 2, 80);

  // Certificate Number and Date
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Certificate No: ${certificateNumber}`, 20, 95);
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 60, 95);

  // Certificate Content
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  
  const content = generateCertificateContent(request, student, school, classes); // Pass classes
  const lines = pdf.splitTextToSize(content, pageWidth - 60);
  
  let yPosition = 120;
  lines.forEach((line: string) => {
    pdf.text(line, 30, yPosition);
    yPosition += 8;
  });

  // Purpose
  if (request.purpose) {
    yPosition += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Purpose:', 30, yPosition);
    pdf.setFont('helvetica', 'normal');
    yPosition += 8;
    const purposeLines = pdf.splitTextToSize(request.purpose, pageWidth - 60);
    purposeLines.forEach((line: string) => {
      pdf.text(line, 30, yPosition);
      yPosition += 8;
    });
  }

  // Additional Details
  if (request.additionalDetails) {
    yPosition += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Additional Details:', 30, yPosition);
    pdf.setFont('helvetica', 'normal');
    yPosition += 8;
    const detailLines = pdf.splitTextToSize(request.additionalDetails, pageWidth - 60);
    detailLines.forEach((line: string) => {
      pdf.text(line, 30, yPosition);
      yPosition += 8;
    });
  }

  // Validity
  if (request.validUntil) {
    yPosition += 15;
    pdf.setFont('helvetica', 'italic');
    pdf.text(`This certificate is valid until: ${new Date(request.validUntil).toLocaleDateString()}`, 30, yPosition);
  }

  // Signature Section
  const signatureY = pageHeight - 80;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  
  // Principal Signature
  pdf.text('_________________________', pageWidth - 120, signatureY);
  pdf.text('Principal', pageWidth - 100, signatureY + 10);
  pdf.text(school.name, pageWidth - 120, signatureY + 20);

  // School Seal
  pdf.text('Place for', 30, signatureY);
  pdf.text('School Seal', 30, signatureY + 10);
  pdf.rect(25, signatureY - 15, 60, 40);

  // Footer
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  const footerText = 'This is a computer-generated certificate and does not require a physical signature.';
  const footerWidth = pdf.getTextWidth(footerText);
  pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 25);

  // Generate blob URL
  const pdfBlob = pdf.output('blob');
  return URL.createObjectURL(pdfBlob);
};

const getCertificateTitle = (type: string): string => {
  const titles = {
    bonafide: 'BONAFIDE CERTIFICATE',
    character: 'CHARACTER CERTIFICATE',
    transfer: 'TRANSFER CERTIFICATE',
    conduct: 'CONDUCT CERTIFICATE',
    study: 'STUDY CERTIFICATE',
    migration: 'MIGRATION CERTIFICATE'
  };
  return titles[type as keyof typeof titles] || 'CERTIFICATE';
};

const generateCertificateContent = (
  request: CertificateRequest,
  student: User,
 school: School,
  classes: { id: string; name: string }[] // Accept classes
): string => {
  const currentDate = new Date().toLocaleDateString();
  
  const baseContent = `This is to certify that ${student.name}, son/daughter of ${student.parentName || 'N/A'}, `;
  
  const contentMap = {
    bonafide: `${baseContent}is a bonafide student of this institution studying in ${getStudentClass(student, classes)} during the academic year ${getCurrentAcademicYear()}. He/She bears a good moral character and is regular in attendance.`,
    
    character: `${baseContent}has been studying in this institution from ${getAdmissionYear(student)} to ${currentDate}. During this period, his/her conduct and character have been found to be good. He/She has not been involved in any disciplinary action.`,
    
    transfer: `${baseContent}was a student of this institution studying in ${getStudentClass(student, classes)}. He/She is hereby granted transfer certificate to join another institution. All dues have been cleared and there are no pending issues.`,
    
    conduct: `${baseContent}has maintained excellent conduct throughout his/her tenure at this institution. He/She has been respectful to teachers and fellow students and has actively participated in school activities.`,
    
    study: `${baseContent}is currently pursuing his/her studies in ${getStudentClass(student)} at this institution. He/She is a regular student with good academic performance and attendance record.`,
    
    migration: `${baseContent}has successfully completed his/her studies at this institution. This certificate is issued to enable him/her to seek admission in higher studies or for employment purposes.`
  };

  return contentMap[request.certificateType as keyof typeof contentMap] || baseContent;
};

const getStudentClass = (student: User): string => {
  // This would typically fetch from the class data
  return 'Grade 10A'; // Placeholder
};

const getCurrentAcademicYear = (): string => {
  const currentYear = new Date().getFullYear();
  return `${currentYear}-${currentYear + 1}`;
};

const getAdmissionYear = (student: User): string => {
  // This would typically be stored in student data
  return new Date(student.createdAt).getFullYear().toString();
};

export const downloadPDF = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};