import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Img,
} from '@react-email/components';
import * as React from 'react';

interface TicketComputoEmailProps {
  consecutivo: string;
  responsable: string;
  departamento: string;
  serviceTag: string;
  telefono: string;
  detallesReporte: string;
}

export const TicketComputoEmail = ({
  consecutivo = 'N/A',
  responsable = 'N/A',
  departamento = 'N/A',
  serviceTag = 'N/A',
  telefono = 'N/A',
  detallesReporte = 'N/A',
}: TicketComputoEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Solicitud de mantenimiento de cómputo: {consecutivo}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header Image */}
          <Section style={imageSection}>
            <Img
              src="https://cloud.sifygsa.com/header-computo.png"
              width="600"
              height="auto"
              alt="SIFYGSA Mantenimiento TI"
              style={headerImage}
            />
          </Section>

          <Section style={content}>
            <Text style={text}>Estimado(a),</Text>
            
            <Text style={text}>
              Se le comunica que su solicitud de mantentenimiento y/o revisión de equipo de computo, con el consecutivo <strong>{consecutivo}</strong> fue entregado con las siguientes especificaciones:
            </Text>

            <Section style={listContainer}>
              <ul style={list}>
                <li style={listItem}><strong>Responsable del equipo:</strong> {responsable}</li>
                <li style={listItem}><strong>Departamento:</strong> {departamento}</li>
                <li style={listItem}><strong>Número Tag del equipo:</strong> {serviceTag}</li>
                <li style={listItem}><strong>Número de telefónico:</strong> {telefono}</li>
                <li style={listItem}><strong>Detalles de su reporte:</strong> {detallesReporte}</li>
              </ul>
            </Section>

            <Text style={text}>
              El equipo de TI se pondrá en contacto con usted en un tiempo de 24 a 48 hrs para coordinación de ambas partes y asi brindar la mejor atención posible.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default TicketComputoEmail;

// Estilos
const main = {
  backgroundColor: '#ffffff',
  padding: '20px 0',
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
};

const content = {
  padding: '20px',
};

const text = {
  color: '#333333',
  fontSize: '15px',
  lineHeight: '1.6',
  marginBottom: '15px',
};

const listContainer = {
  marginBottom: '20px',
};

const list = {
  paddingLeft: '20px',
  margin: '0',
  color: '#333333',
  fontSize: '15px',
  lineHeight: '1.6',
};

const listItem = {
  marginBottom: '5px',
};

const imageSection = {
  width: '100%',
  backgroundColor: '#fba73c', // Un fondo naranja por si la imagen tiene transparencias
};

const headerImage = {
  width: '100%',
  maxWidth: '600px',
  display: 'block',
  margin: '0 auto',
};
