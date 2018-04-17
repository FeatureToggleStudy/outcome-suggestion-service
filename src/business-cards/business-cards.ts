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
    '../businesscardformempty.pdf',
  );

  const data = {
    Name2: name,
    Org2: org,
    Org1: org,
    Name3: name,
    Org3: org,
    Name4: name,
    Org4: org,
    Name5: name,
    Org5: org,
    Name6: name,
    Org6: org,
    Name7: name,
    Org7: org,
    Name8: name,
    Org8: org,
    Name9: name,
    Org9: org,
    Name10: name,
    Org10: org,
    Name1: name,
    URL1: url,
    URL2: url,
    URL9: url,
    URL10: url,
    URL3: url,
    URL4: url,
    URL5: url,
    URL6: url,
    URL7: url,
    URL8: url,
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
