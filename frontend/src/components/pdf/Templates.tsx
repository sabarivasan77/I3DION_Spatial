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
  logoUrl?: string;
  date: string;
  products: any[];
  template: 'IndustrialClassic' | 'ModernShowcase' | 'SalesBrochure' | 'LuxuryMinimalist' | 'CyberNeo' | 'NordicElegance' | 'ArchitecturalSpatial' | 'QuantumHologram';
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
      <Image src={data.logoUrl || '/images/logos/05_full_logo_dark.png'} style={{ width: 140, height: 45, marginBottom: 24, objectFit: 'contain' }} />
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
// TEMPLATE 4: Luxury Minimalist
// ----------------------------------------------------------------------
const luxStyles = StyleSheet.create({
  page: { fontFamily: 'Roboto', backgroundColor: '#FAFAFA', padding: 50 },
  coverPage: { fontFamily: 'Roboto', backgroundColor: '#111111', padding: 60, justifyContent: 'center', alignItems: 'center', color: '#FFF' },
  coverTitle: { fontSize: 36, fontWeight: 300, marginBottom: 15, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 4, color: '#D4AF37' },
  coverCompany: { fontSize: 14, color: '#A3A3A3', marginBottom: 50, letterSpacing: 2, textTransform: 'uppercase' },
  productContainer: { marginBottom: 60, paddingBottom: 60, borderBottomWidth: 1, borderBottomColor: '#EAEAEA' },
  header: { fontSize: 20, fontWeight: 300, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 40, color: '#111', textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#D4AF37', paddingBottom: 10 },
  prodName: { fontSize: 24, fontWeight: 300, color: '#111', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 2 },
  prodDesc: { fontSize: 11, color: '#666', marginBottom: 20, lineHeight: 1.6, fontWeight: 300 },
  imageWrapper: { padding: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 20, alignItems: 'center' },
  specRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F5F5F5', paddingVertical: 8 },
  specKey: { width: '40%', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 1 },
  specVal: { width: '60%', fontSize: 10, color: '#333', textAlign: 'right' },
  qrContainer: { flexDirection: 'row', marginTop: 30, alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EAEAEA' },
});

const LuxuryMinimalist = ({ data }: { data: CatalogData }) => (
  <Document>
    <Page size="A4" style={luxStyles.coverPage}>
      <Text style={luxStyles.coverTitle}>{data.name}</Text>
      <Text style={luxStyles.coverCompany}>{data.companyName}</Text>
      {data.description && <Text style={{ fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 1.5, maxWidth: '80%' }}>{data.description}</Text>}
      <Text style={{ fontSize: 10, color: '#555', position: 'absolute', bottom: 50, letterSpacing: 1, textTransform: 'uppercase' }}>EST. {data.date}</Text>
    </Page>
    <Page size="A4" style={luxStyles.page}>
      <Text style={luxStyles.header}>The Collection</Text>
      {data.products.map((p, i) => (
        <View key={i} style={luxStyles.productContainer} wrap={false}>
          <Text style={luxStyles.prodName}>{p.name}</Text>
          <Text style={luxStyles.prodDesc}>{p.description}</Text>
          {p.imageUrl && (
            <View style={luxStyles.imageWrapper}>
              <Image src={p.imageUrl} style={{ width: '100%', height: 250, objectFit: 'contain' }} />
            </View>
          )}
          {p.specs && Object.keys(p.specs).length > 0 && (
            <View style={{ marginTop: 10 }}>
              {Object.entries(p.specs).map(([k, v]) => (
                <View key={k} style={luxStyles.specRow}>
                  <Text style={luxStyles.specKey}>{k}</Text>
                  <Text style={luxStyles.specVal}>{String(v)}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={luxStyles.qrContainer}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#D4AF37', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>Immersive Experience</Text>
              <Text style={{ fontSize: 9, color: '#888' }}>Scan the code to view this piece in your space.</Text>
            </View>
            {p.qrUrl && <Image src={p.qrUrl} style={{ width: 60, height: 60 }} />}
          </View>
        </View>
      ))}
    </Page>
  </Document>
);

// ----------------------------------------------------------------------
// TEMPLATE 5: Cyber Neo
// ----------------------------------------------------------------------
const cyberStyles = StyleSheet.create({
  page: { fontFamily: 'Roboto', backgroundColor: '#09090B', padding: 30, color: '#E2E8F0' },
  coverPage: { fontFamily: 'Roboto', backgroundColor: '#020617', padding: 40, justifyContent: 'center' },
  coverTitle: { fontSize: 48, fontWeight: 700, color: '#22D3EE', marginBottom: 20 },
  coverCompany: { fontSize: 16, color: '#F8FAFC', backgroundColor: '#1E293B', padding: 10, alignSelf: 'flex-start' },
  header: { fontSize: 24, fontWeight: 700, color: '#22D3EE', borderLeftWidth: 4, borderLeftColor: '#D946EF', paddingLeft: 10, marginBottom: 30 },
  card: { backgroundColor: '#0F172A', padding: 20, marginBottom: 30, borderWidth: 1, borderColor: '#1E293B' },
  prodName: { fontSize: 22, fontWeight: 700, color: '#F8FAFC', marginBottom: 8 },
  qrBox: { position: 'absolute', top: 20, right: 20, padding: 10, backgroundColor: '#020617', borderWidth: 1, borderColor: '#22D3EE' },
  image: { height: 200, width: '100%', objectFit: 'contain', marginVertical: 15, backgroundColor: '#020617', padding: 10 },
});

const CyberNeo = ({ data }: { data: CatalogData }) => (
  <Document>
    <Page size="A4" style={cyberStyles.coverPage}>
      <Text style={cyberStyles.coverTitle}>{data.name}</Text>
      <Text style={cyberStyles.coverCompany}>// {data.companyName} //</Text>
      {data.description && <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 30, maxWidth: 400 }}>{data.description}</Text>}
    </Page>
    <Page size="A4" style={cyberStyles.page}>
      <Text style={cyberStyles.header}>[ DATABASE : ASSETS ]</Text>
      {data.products.map((p, i) => (
        <View key={i} style={cyberStyles.card} wrap={false}>
          <Text style={cyberStyles.prodName}>{p.name.toUpperCase()}</Text>
          <Text style={{ fontSize: 10, color: '#94A3B8', width: '70%' }}>{p.description}</Text>
          
          {p.qrUrl && (
            <View style={cyberStyles.qrBox}>
              <Image src={p.qrUrl} style={{ width: 50, height: 50 }} />
              <Text style={{ fontSize: 6, color: '#22D3EE', marginTop: 4, textAlign: 'center' }}>SCAN LINK</Text>
            </View>
          )}

          {p.imageUrl && <Image src={p.imageUrl} style={cyberStyles.image} />}

          {p.specs && Object.keys(p.specs).length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
              {Object.entries(p.specs).map(([k, v]) => (
                <View key={k} style={{ width: '50%', marginBottom: 10, paddingRight: 10 }}>
                  <Text style={{ fontSize: 8, color: '#D946EF', marginBottom: 2 }}>{k.toUpperCase()}</Text>
                  <Text style={{ fontSize: 10, color: '#E2E8F0' }}>{String(v)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </Page>
  </Document>
);

// ----------------------------------------------------------------------
// TEMPLATE 6: Nordic Elegance
// ----------------------------------------------------------------------
const nordicStyles = StyleSheet.create({
  page: { fontFamily: 'Roboto', backgroundColor: '#F8FAF9', padding: 40 },
  coverPage: { fontFamily: 'Roboto', backgroundColor: '#EBF1ED', padding: 50, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 400, color: '#2C3E35', textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, marginBottom: 30 },
  imageContainer: { width: '100%', height: 220, backgroundColor: '#F4F7F6', borderRadius: 12, marginBottom: 20, overflow: 'hidden' },
});

const NordicElegance = ({ data }: { data: CatalogData }) => (
  <Document>
    <Page size="A4" style={nordicStyles.coverPage}>
      <Text style={nordicStyles.title}>{data.name}</Text>
      <Text style={{ fontSize: 16, color: '#5E8B7E', marginBottom: 30 }}>{data.companyName}</Text>
      <Text style={{ fontSize: 12, color: '#7E9F93', textAlign: 'center', maxWidth: 300, lineHeight: 1.5 }}>{data.description}</Text>
    </Page>
    <Page size="A4" style={nordicStyles.page}>
      {data.products.map((p, i) => (
        <View key={i} style={nordicStyles.card} wrap={false}>
          {p.imageUrl && (
            <View style={nordicStyles.imageContainer}>
              <Image src={p.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </View>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '70%' }}>
              <Text style={{ fontSize: 20, color: '#2C3E35', fontWeight: 500, marginBottom: 8 }}>{p.name}</Text>
              <Text style={{ fontSize: 11, color: '#6A7D75', lineHeight: 1.5, marginBottom: 15 }}>{p.description}</Text>
              
              {p.specs && Object.keys(p.specs).length > 0 && (
                <View style={{ backgroundColor: '#F4F7F6', padding: 12, borderRadius: 8 }}>
                  {Object.entries(p.specs).map(([k, v]) => (
                    <View key={k} style={{ flexDirection: 'row', marginBottom: 4 }}>
                      <Text style={{ width: '40%', fontSize: 9, color: '#5E8B7E', fontWeight: 500 }}>{k}</Text>
                      <Text style={{ width: '60%', fontSize: 9, color: '#2C3E35' }}>{String(v)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <View style={{ width: '25%', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 9, color: '#5E8B7E', marginBottom: 8, textAlign: 'center' }}>AR Preview</Text>
              {p.qrUrl && <Image src={p.qrUrl} style={{ width: 60, height: 60, borderRadius: 8 }} />}
            </View>
          </View>
        </View>
      ))}
    </Page>
  </Document>
);

// ----------------------------------------------------------------------
// TEMPLATE 7: Architectural Spatial
// ----------------------------------------------------------------------
const archStyles = StyleSheet.create({
  page: { fontFamily: 'Roboto', backgroundColor: '#FFFFFF', padding: 30 },
  coverPage: { fontFamily: 'Roboto', backgroundColor: '#111827', padding: 40, color: '#F9FAFB' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 2, borderTopColor: '#111827' },
  gridItem: { width: '50%', padding: 15, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', borderRightWidth: 1, borderRightColor: '#E5E7EB' },
});

const ArchitecturalSpatial = ({ data }: { data: CatalogData }) => (
  <Document>
    <Page size="A4" style={archStyles.coverPage}>
      <View style={{ borderLeftWidth: 4, borderLeftColor: '#F3F4F6', paddingLeft: 20, marginTop: 100 }}>
        <Text style={{ fontSize: 40, fontWeight: 700, marginBottom: 10 }}>{data.name.toUpperCase()}</Text>
        <Text style={{ fontSize: 14, color: '#9CA3AF', letterSpacing: 2 }}>{data.companyName.toUpperCase()}</Text>
      </View>
      <Text style={{ position: 'absolute', bottom: 40, left: 40, fontSize: 10, color: '#6B7280' }}>DOC REF: {data.date}</Text>
    </Page>
    <Page size="A4" style={archStyles.page}>
      <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 20, color: '#111827' }}>INDEX / ASSETS</Text>
      <View style={archStyles.gridContainer}>
        {data.products.map((p, i) => (
          <View key={i} style={[archStyles.gridItem, i % 2 !== 0 ? { borderRightWidth: 0 } : {}]} wrap={false}>
            <View style={{ height: 150, backgroundColor: '#F3F4F6', marginBottom: 10, padding: 10 }}>
              {p.imageUrl && <Image src={p.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
            </View>
            <Text style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 5 }}>{p.name}</Text>
            <Text style={{ fontSize: 9, color: '#4B5563', marginBottom: 10 }}>{(p.description || '').substring(0, 80)}...</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                {p.specs && Object.entries(p.specs).slice(0, 3).map(([k, v]) => (
                  <Text key={k} style={{ fontSize: 8, color: '#6B7280' }}>{k}: {String(v)}</Text>
                ))}
              </View>
              {p.qrUrl && <Image src={p.qrUrl} style={{ width: 40, height: 40 }} />}
            </View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

// ----------------------------------------------------------------------
// TEMPLATE 8: Quantum Hologram
// ----------------------------------------------------------------------
const quantumStyles = StyleSheet.create({
  page: { fontFamily: 'Roboto', backgroundColor: '#0D0518', padding: 40, color: '#F3E8FF' },
  coverPage: { fontFamily: 'Roboto', backgroundColor: '#1A0B2E', padding: 50, justifyContent: 'center' },
  prodCard: { backgroundColor: '#1F103A', borderRadius: 20, padding: 25, marginBottom: 30 },
  imgWrapper: { backgroundColor: '#2D1A54', borderRadius: 15, padding: 20, marginBottom: 20 },
});

const QuantumHologram = ({ data }: { data: CatalogData }) => (
  <Document>
    <Page size="A4" style={quantumStyles.coverPage}>
      <Text style={{ fontSize: 44, fontWeight: 700, color: '#D8B4FE', textAlign: 'center', marginBottom: 20 }}>{data.name}</Text>
      <Text style={{ fontSize: 18, color: '#C084FC', textAlign: 'center' }}>{data.companyName}</Text>
    </Page>
    <Page size="A4" style={quantumStyles.page}>
      {data.products.map((p, i) => (
        <View key={i} style={quantumStyles.prodCard} wrap={false}>
          <Text style={{ fontSize: 24, fontWeight: 700, color: '#E9D5FF', marginBottom: 10 }}>{p.name}</Text>
          <Text style={{ fontSize: 11, color: '#D8B4FE', marginBottom: 20 }}>{p.description}</Text>
          {p.imageUrl && (
            <View style={quantumStyles.imgWrapper}>
              <Image src={p.imageUrl} style={{ height: 200, width: '100%', objectFit: 'contain' }} />
            </View>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: '70%' }}>
              {p.specs && Object.keys(p.specs).length > 0 && Object.entries(p.specs).slice(0, 4).map(([k, v]) => (
                <View key={k} style={{ flexDirection: 'row', marginBottom: 5 }}>
                  <Text style={{ width: '40%', fontSize: 10, color: '#C084FC', fontWeight: 700 }}>{k}</Text>
                  <Text style={{ width: '60%', fontSize: 10, color: '#E9D5FF' }}>{String(v)}</Text>
                </View>
              ))}
            </View>
            {p.qrUrl && (
              <View style={{ backgroundColor: '#2D1A54', padding: 5, borderRadius: 8 }}>
                <Image src={p.qrUrl} style={{ width: 50, height: 50 }} />
              </View>
            )}
          </View>
        </View>
      ))}
    </Page>
  </Document>
);

// ----------------------------------------------------------------------
// EXPORT COMPONENT
// ----------------------------------------------------------------------
export const CatalogPDF = ({ data }: { data: CatalogData }) => {
  switch (data.template) {
    case 'ModernShowcase': return <ModernShowcase data={data} />;
    case 'SalesBrochure': return <SalesBrochure data={data} />;
    case 'LuxuryMinimalist': return <LuxuryMinimalist data={data} />;
    case 'CyberNeo': return <CyberNeo data={data} />;
    case 'NordicElegance': return <NordicElegance data={data} />;
    case 'ArchitecturalSpatial': return <ArchitecturalSpatial data={data} />;
    case 'QuantumHologram': return <QuantumHologram data={data} />;
    default: return <IndustrialClassic data={data} />;
  }
};
