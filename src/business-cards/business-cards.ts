import * as pdfFiller from 'pdffiller-stream';
import { Responder } from '../interfaces/Responder';
import { Readable } from 'stream';
import * as path from 'path';

export async function fillPdf(
  responder: Responder,
  first_name: string,
  last_name: string,
  user_name: string,
  org: string,
) {
  let name: string = first_name + ' ' + last_name;
  name = name.replace(/"/g, '');
  org = org.replace(/"/g, '');
  const url: string = 'clark.center/' + user_name;
  const sourcePDF: string = path.join(
    __dirname,
    '../businesscardformemptynew.pdf',
  );

  const data = {
    Org1: org,
    Name1: name,
    URL1: url,
  };

  try {
    const outputStream: Readable = await pdfFiller.fillForm(sourcePDF, data);
    outputStream.pipe(responder.writeStream());
  } catch (e) {
    responder.sendOperationError(
      `Problem generating business cards. Error: ${e}`,
    );
  }
}
