import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register standard fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
});

export interface CatalogData {
  name: string;
  description: string;
  companyName: string;
  date: string;
  products: any[];
  template: 'IndustrialClassic' | 'ModernShowcase' | 'SalesBrochure';
}

// ----------------------------------------------------------------------
// TEMPLATE 1: Industrial Classic
// ----------------------------------------------------------------------
const icStyles = StyleSheet.create({
  page: { fontFamily: 'Roboto', backgroundColor: '#FFFFFF', padding: 30 },
  coverPage: { fontFamily: 'Roboto', backgroundColor: '#0F172A', padding: 40, justifyContent: 'center', alignItems: 'center', color: 'white' },
  coverTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  coverCompany: { fontSize: 18, color: '#94A3B8', marginBottom: 40 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1E293B', borderBottomWidth: 2, borderBottomColor: '#3B82F6', paddingBottom: 10 },
  productContainer: { marginBottom: 30, padding: 15, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8 },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 5 },
  productDesc: { fontSize: 11, color: '#475569', marginBottom: 15, lineHeight: 1.4 },
  productImage: { width: '100%', height: 200, objectFit: 'contain', backgroundColor: '#F8FAFC', marginBottom: 15 },
  specBox: { marginTop: 10, padding: 10, backgroundColor: '#F1F5F9' },
  specLine: { flexDirection: 'row', marginBottom: 4 },
  specKey: { fontSize: 10, fontWeight: 'bold', width: 100, color: '#334155' },
  specValue: { fontSize: 10, color: '#475569', flex: 1 },
  footerSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  qrCode: { width: 60, height: 60 },
});

const IndustrialClassic = ({ data }: { data: CatalogData }) => (
  <Document>
    <Page size="A4" style={icStyles.coverPage}>
      <Text style={icStyles.coverTitle}>{data.name}</Text>
      <Text style={icStyles.coverCompany}>{data.companyName}</Text>
      {data.description && <Text style={{ fontSize: 14, color: '#CBD5E1', textAlign: 'center' }}>{data.description}</Text>}
      <Text style={{ fontSize: 12, color: '#64748B', position: 'absolute', bottom: 40 }}>Generated {data.date}</Text>
    </Page>
    <Page size="A4" style={icStyles.page}>
      <Text style={icStyles.header}>Product Catalog</Text>
      {data.products.map((p, i) => (
        <View key={i} style={icStyles.productContainer} wrap={false}>
          <Text style={icStyles.productName}>{p.name}</Text>
          <Text style={icStyles.productDesc}>{p.description || 'No description'}</Text>
          {p.imageUrl && <Image src={p.imageUrl} style={icStyles.productImage} />}
          {p.specs && Object.keys(p.specs).length > 0 && (
            <View style={icStyles.specBox}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>Specifications</Text>
              {Object.entries(p.specs).map(([k, v]) => (
                <View key={k} style={icStyles.specLine}>
                  <Text style={icStyles.specKey}>{k}</Text>
                  <Text style={icStyles.specValue}>{String(v)}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={icStyles.footerSection}>
            <Text style={{ fontSize: 10, color: '#64748B', width: 150 }}>Scan with mobile to view AR model</Text>
            {p.qrUrl ? <Image src={p.qrUrl} style={icStyles.qrCode} /> : <View style={[icStyles.qrCode, { backgroundColor: '#eee' }]} />}
          </View>
        </View>
      ))}
    </Page>
  </Document>
);

// ----------------------------------------------------------------------
// TEMPLATE 2: Modern Showcase
// ----------------------------------------------------------------------
const msStyles = StyleSheet.create({
  page: { fontFamily: 'Roboto', backgroundColor: '#F8FAFC' },
  coverPage: { fontFamily: 'Roboto', backgroundColor: '#2563EB', padding: 50, color: 'white', justifyContent: 'center' },
  coverTitle: { fontSize: 42, fontWeight: 'bold', marginBottom: 15 },
  productPage: { flexDirection: 'row', backgroundColor: '#FFFFFF', margin: 20, borderRadius: 12 },
  leftCol: { width: '50%', backgroundColor: '#F1F5F9', padding: 20, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  rightCol: { width: '50%', padding: 30, justifyContent: 'center' },
  prodImage: { width: '100%', height: '100%', objectFit: 'contain' },
  prodName: { fontSize: 26, fontWeight: 'bold', color: '#0F172A', marginBottom: 10 },
  qrBox: { alignItems: 'center', marginTop: 30, padding: 15, backgroundColor: '#F8FAFC', borderRadius: 8 },
});

const ModernShowcase = ({ data }: { data: CatalogData }) => (
  <Document>
    <Page size="A4" style={msStyles.coverPage}>
      <Text style={msStyles.coverTitle}>{data.name}</Text>
      <Text style={{ fontSize: 20, opacity: 0.8 }}>{data.companyName}</Text>
    </Page>
    {data.products.map((p, i) => (
      <Page key={i} size="A4" style={msStyles.page} orientation="landscape">
        <View style={msStyles.productPage}>
          <View style={msStyles.leftCol}>
            {p.imageUrl && <Image src={p.imageUrl} style={msStyles.prodImage} />}
          </View>
          <View style={msStyles.rightCol}>
            <Text style={msStyles.prodName}>{p.name}</Text>
            <Text style={{ fontSize: 12, color: '#475569', marginBottom: 20 }}>{p.description}</Text>
            {p.specs && Object.keys(p.specs).length > 0 && Object.entries(p.specs).slice(0, 4).map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', marginBottom: 5, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 5 }}>
                <Text style={{ width: '40%', fontSize: 11, fontWeight: 'bold', color: '#334155' }}>{k}</Text>
                <Text style={{ width: '60%', fontSize: 11, color: '#64748B' }}>{String(v)}</Text>
              </View>
            ))}
            <View style={msStyles.qrBox}>
              <Text style={{ fontSize: 10, color: '#2563EB', marginBottom: 8, fontWeight: 'bold' }}>SCAN FOR AR PREVIEW</Text>
              {p.qrUrl ? <Image src={p.qrUrl} style={{ width: 80, height: 80 }} /> : <View style={{ width: 80, height: 80, backgroundColor: '#eee' }} />}
            </View>
          </View>
        </View>
      </Page>
    ))}
  </Document>
);

// ----------------------------------------------------------------------
// TEMPLATE 3: Sales Brochure
// ----------------------------------------------------------------------
const sbStyles = StyleSheet.create({
  page: { fontFamily: 'Roboto', backgroundColor: '#FFFFFF', padding: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#0F172A', paddingBottom: 20, marginBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', marginBottom: 30 },
  imageBox: { height: 180, backgroundColor: '#F1F5F9', marginBottom: 10 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  qrLine: { flexDirection: 'row', alignItems: 'center', marginTop: 10, padding: 8, backgroundColor: '#F8FAFC', borderRadius: 4 },
});

const SalesBrochure = ({ data }: { data: CatalogData }) => (
  <Document>
    <Page size="A4" style={sbStyles.page}>
      <View style={sbStyles.header}>
        <View>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0F172A' }}>{data.name}</Text>
          <Text style={{ fontSize: 14, color: '#64748B' }}>{data.companyName}</Text>
        </View>
      </View>
      <View style={sbStyles.grid}>
        {data.products.map((p, i) => (
          <View key={i} style={sbStyles.card} wrap={false}>
            <View style={sbStyles.imageBox}>
              {p.imageUrl && <Image src={p.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </View>
            <Text style={sbStyles.name}>{p.name}</Text>
            <Text style={{ fontSize: 10, color: '#475569', marginTop: 4, height: 30 }}>{(p.description || '').substring(0, 100)}...</Text>
            
            <View style={sbStyles.qrLine}>
              {p.qrUrl ? <Image src={p.qrUrl} style={{ width: 30, height: 30, marginRight: 10 }} /> : <View style={{ width: 30, height: 30, marginRight: 10, backgroundColor: '#eee' }} />}
              <Text style={{ fontSize: 9, color: '#334155', flex: 1 }}>Scan to view in augmented reality</Text>
            </View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

// ----------------------------------------------------------------------
// EXPORT COMPONENT
// ----------------------------------------------------------------------
export const CatalogPDF = ({ data }: { data: CatalogData }) => {
  if (data.template === 'ModernShowcase') return <ModernShowcase data={data} />;
  if (data.template === 'SalesBrochure') return <SalesBrochure data={data} />;
  return <IndustrialClassic data={data} />;
};
