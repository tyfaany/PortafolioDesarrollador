import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportarPerfilPDF(elementoRef, nombreArchivo = 'perfil.pdf') {
  if (!elementoRef) {
    throw new Error('No se encontró el contenido a exportar.');
  }

  const canvas = await html2canvas(elementoRef, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    scrollX: 0,
    scrollY: -window.scrollY,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const printableWidth = pageWidth - margin * 2;
  const printableHeight = pageHeight - margin * 2;
  const imgWidth = printableWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
  heightLeft -= printableHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= printableHeight;
  }

  pdf.save(nombreArchivo);
}
