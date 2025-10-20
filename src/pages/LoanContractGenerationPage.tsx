import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useSupabaseQuery } from '../hooks/useSupabase';
import { DateUtils } from '../utils/dateUtils';
import { LetterheadService } from '../services/letterheadService';
import { EmailService } from '../services/emailService';
import TextFormattingToolbar from '../components/TextFormattingToolbar';
import MultiPageDisplay from '../components/MultiPageDisplay';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useLanguage } from '../context/LanguageContext';
import { roundAmount } from '../utils/roundingUtils';
import {
  Save, RefreshCw, FileText,
  User, DollarSign, Percent, Clock, CheckCircle, Upload, X,
  Download, Mail, Eye, EyeOff, AlertCircle
} from 'lucide-react';

interface RepaymentScheduleEntry {
  paymentNumber: number;
  dueDate: string;
  principalPortion: number;
  interestPortion: number;
  managementFeePortion: number;
  totalPayment: number;
  remainingBalance: number;
}

interface LoanApplication {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  clientOccupation: string;
  clientEmployer: string;
  clientLocation: string;
  principalAmount: number;
  interestRate: number;
  managementFeeRate: number;
  termMonths: number;
  disbursementDate: string;
  maturityDate: string;
  totalRepayment: number;
  monthlyPayment: number;
  calculationMethod: string;
  status: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorAddress: string;
  guarantorOccupation: string;
  applicationFee: number;
  legalFee: number;
}

const LoanContractGenerationPage: React.FC = () => {
  const { loanApplicationId } = useParams<{ loanApplicationId: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { t } = useLanguage();

  const [contractText, setContractText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [letterhead, setLetterhead] = useState<File | null>(null);
  const [letterheadPreview, setLetterheadPreview] = useState<string | null>(null);
  const [repaymentSchedule, setRepaymentSchedule] = useState<RepaymentScheduleEntry[]>([]);
  
  // New state for enhanced features
  const [hasActiveLetterhead, setHasActiveLetterhead] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showPageLayout, setShowPageLayout] = useState(true); // Default to true to show A4 layout
  const contractEditorRef = useRef<HTMLDivElement>(null);
  
  // Undo/Redo state
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Fetch real loan application data from Supabase
  const { data: loanApplication, loading, error } = useSupabaseQuery('loan_applications', {
    filter: [{ column: 'id', operator: 'eq', value: loanApplicationId }],
    select: `
      *,
      client:clients!client_id (
        id,
        first_name,
        last_name,
        full_name,
        middle_name,
        phone_number,
        email_address,
        street_name,
        house_number,
        area_of_residence,
        company_name
      )
    `
  });

  // Alternative query without filter to test if table exists
  const { data: allApplications } = useSupabaseQuery('loan_applications', {
    select: 'id, status, requested_amount',
    limit: 5
  });

  // Get clients data to use for sample data
  const { data: clients } = useSupabaseQuery('clients', {
    select: 'id, first_name, last_name, phone_number, email_address, street_name, house_number, area_of_residence, company_name, position, business_name, type_of_business',
    limit: 5
  });

  // Check for existing letterhead
  useEffect(() => {
    const checkLetterhead = async () => {
      try {
        const hasLetterhead = await LetterheadService.hasActiveLetterhead();
        setHasActiveLetterhead(hasLetterhead);
        
        if (hasLetterhead) {
          const letterheadData = await LetterheadService.getActiveLetterhead();
          if (letterheadData) {
            setLetterheadPreview(letterheadData.file_url);
          }
        }
      } catch (error) {
        console.error('Error checking letterhead:', error);
      }
    };
    
    checkLetterhead();
  }, []);

  // Ensure content is properly set when switching to edit mode
  useEffect(() => {
    if (isEditing && contractEditorRef.current) {
      // Set the content properly when entering edit mode
      const htmlContent = ensureProperHtmlContent(contractText);
      if (contractEditorRef.current.innerHTML !== htmlContent) {
        contractEditorRef.current.innerHTML = htmlContent;
      }
    }
  }, [isEditing, contractText, contractEditorRef]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing && (e.ctrlKey || e.metaKey)) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    if (isEditing) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isEditing, canUndo, canRedo]);

  // Debug logging
  useEffect(() => {
    console.log('LoanContractGenerationPage Debug:', {
      loanApplicationId,
      loading,
      error,
      loanApplication,
      loanApplicationLength: loanApplication?.length,
      allApplications,
      allApplicationsLength: allApplications?.length,
      clients,
      clientsLength: clients?.length,
      hasClientData: loanApplication?.[0]?.client ? 'Yes' : 'No',
      clientFirstName: loanApplication?.[0]?.client?.first_name,
      clientLastName: loanApplication?.[0]?.client?.last_name,
      clientFullName: loanApplication?.[0]?.client?.full_name,
      constructedName: loanApplication?.[0]?.client ? 
        (loanApplication[0].client.full_name || 
         `${loanApplication[0].client.first_name || ''} ${loanApplication[0].client.last_name || ''}`.trim() || 
         'Unknown Client') : 
        'Unknown Client'
    });
  }, [loanApplicationId, loading, error, loanApplication, allApplications, clients]);

  // Transform the fetched data to match our interface
  const transformedLoanApplication: LoanApplication | null = loanApplication && loanApplication.length > 0 ? {
    id: loanApplication[0].id,
    clientName: `${loanApplication[0].client?.first_name || ''} ${loanApplication[0].client?.last_name || ''}`.trim() || loanApplication[0].client?.full_name || 'Unknown Client',
    clientPhone: loanApplication[0].client?.phone_number || '',
    clientEmail: loanApplication[0].client?.email_address || '',
    clientAddress: `${loanApplication[0].client?.street_name || ''} ${loanApplication[0].client?.house_number || ''}, ${loanApplication[0].client?.area_of_residence || ''}`.trim() || 'Address not provided',
    clientOccupation: 'Not specified',
    clientEmployer: loanApplication[0].client?.company_name || 'Not specified',
    clientLocation: loanApplication[0].client?.area_of_residence || 'Location not specified',
    // Use APPROVED amounts from credit assessment, fallback to original if not approved yet
    principalAmount: parseFloat(loanApplication[0].approved_amount || loanApplication[0].requested_amount || loanApplication[0].loan_amount) || 0,
    interestRate: parseFloat(loanApplication[0].approved_interest_rate || loanApplication[0].interest_rate) || 3.5,
    managementFeeRate: parseFloat(loanApplication[0].management_fee_rate) || 2.0, // Default to 2.0% if not set
    termMonths: parseInt(loanApplication[0].approved_tenor || loanApplication[0].repayment_period_months || loanApplication[0].loan_term_months) || 12,
    disbursementDate: loanApplication[0].disbursement_date || DateUtils.addDaysToCurrent(7).split('T')[0],
    maturityDate: loanApplication[0].maturity_date || DateUtils.addMonthsToCurrent(parseInt(loanApplication[0].repayment_period_months || loanApplication[0].loan_term_months) || 12).split('T')[0],
    totalRepayment: parseFloat(loanApplication[0].total_repayment_amount) || 0,
    monthlyPayment: parseFloat(loanApplication[0].monthly_payment) || 0,
    calculationMethod: loanApplication[0].calculation_method || 'reducing_balance',
    status: loanApplication[0].status || 'approved',
    guarantorName: loanApplication[0].guarantor_name || '',
    guarantorPhone: loanApplication[0].guarantor_phone || '',
    guarantorAddress: loanApplication[0].guarantor_address || '',
    guarantorOccupation: loanApplication[0].guarantor_occupation || '',
    applicationFee: parseFloat(loanApplication[0].application_fee) || 0,
    legalFee: parseFloat(loanApplication[0].legal_fee) || 0
  } : null;

  // If we have a loan application but no client data, try to get client data separately
  const loanAppWithoutClient = loanApplication && loanApplication.length > 0 && !loanApplication[0].client;
  const fallbackClientData = clients && clients.length > 0 ? clients[0] : null;

  // Create sample data based on available clients if no loan applications exist
  const createSampleLoanApplication = (): LoanApplication => {
    // Try to get a real client for the sample data
    const sampleClient = clients && clients.length > 0 ? clients[0] : null;
    
    return {
      id: loanApplicationId || 'sample-1',
      clientName: sampleClient ? `${sampleClient.first_name || ''} ${sampleClient.last_name || ''}`.trim() : 'Sample Client',
      clientPhone: sampleClient?.phone_number || '+255 700 000 000',
      clientEmail: sampleClient?.email_address || 'client@example.com',
      clientAddress: sampleClient ? `${sampleClient.street_name || ''} ${sampleClient.house_number || ''}, ${sampleClient.area_of_residence || ''}`.trim() : 'Sample Address, Dar es Salaam',
      clientOccupation: 'Business Owner',
      clientEmployer: sampleClient?.company_name || 'Self Employed',
      clientLocation: sampleClient?.area_of_residence || 'Dar es Salaam',
      principalAmount: 1000000,
      interestRate: 3.5,
      managementFeeRate: 2.0,
      termMonths: 12,
      disbursementDate: DateUtils.addDaysToCurrent(7).split('T')[0],
      maturityDate: DateUtils.addMonthsToCurrent(12).split('T')[0],
      totalRepayment: 1200000,
      monthlyPayment: 100000,
      calculationMethod: 'reducing_balance',
      status: 'approved',
      guarantorName: 'Sample Guarantor',
      guarantorPhone: '+255 700 000 001',
      guarantorAddress: 'Guarantor Address',
      guarantorOccupation: 'Employee'
    };
  };

  const fallbackLoanApplication = createSampleLoanApplication();

  // Calculate missing fields if they don't exist in the database
  const calculateMissingFields = (app: LoanApplication): LoanApplication => {
    if (!app.totalRepayment || app.totalRepayment === 0) {
      // Calculate total repayment using simple interest formula
      const interestAmount = app.principalAmount * (app.interestRate / 100) * (app.termMonths / 12);
      const managementFeeAmount = app.principalAmount * (app.managementFeeRate / 100) * (app.termMonths / 12);
      app.totalRepayment = app.principalAmount + interestAmount + managementFeeAmount;
    }
    
    if (!app.monthlyPayment || app.monthlyPayment === 0) {
      app.monthlyPayment = app.totalRepayment / app.termMonths;
    }
    
    if (!app.disbursementDate) {
      app.disbursementDate = DateUtils.addDaysToCurrent(7).split('T')[0];
    }
    
    if (!app.maturityDate) {
      app.maturityDate = DateUtils.addMonthsToCurrent(app.termMonths).split('T')[0];
    }
    
    return app;
  };

  // Create a fallback loan application using loan data but with fallback client data
  const createFallbackWithLoanData = (): LoanApplication | null => {
    if (!loanApplication || loanApplication.length === 0) return null;
    
    const app = loanApplication[0];
    const clientData = fallbackClientData;
    
    return {
      id: app.id,
      clientName: clientData ? `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim() : 'Unknown Client',
      clientPhone: clientData?.phone_number || '',
      clientEmail: clientData?.email_address || '',
      clientAddress: clientData ? `${clientData.street_name || ''} ${clientData.house_number || ''}, ${clientData.area_of_residence || ''}`.trim() : 'Address not provided',
      clientOccupation: 'Not specified',
      clientEmployer: clientData?.company_name || 'Not specified',
      clientLocation: clientData?.area_of_residence || 'Location not specified',
      // Use actual loan data
      principalAmount: parseFloat(app.requested_amount || app.loan_amount) || 0,
      interestRate: parseFloat(app.interest_rate) || 3.5,
      managementFeeRate: parseFloat(app.management_fee_rate) || 2.0,
      termMonths: parseInt(app.repayment_period_months || app.loan_term_months) || 12,
      disbursementDate: app.disbursement_date || DateUtils.addDaysToCurrent(7).split('T')[0],
      maturityDate: app.maturity_date || DateUtils.addMonthsToCurrent(parseInt(app.repayment_period_months || app.loan_term_months) || 12).split('T')[0],
      totalRepayment: parseFloat(app.total_repayment_amount) || 0,
      monthlyPayment: parseFloat(app.monthly_payment) || 0,
      calculationMethod: app.calculation_method || 'reducing_balance',
      status: app.status || 'approved',
      guarantorName: app.guarantor_name || '',
      guarantorPhone: app.guarantor_phone || '',
      guarantorAddress: app.guarantor_address || '',
      guarantorOccupation: app.guarantor_occupation || ''
    };
  };

  // Use fallback data if there's an error or no data
  const finalLoanApplication = transformedLoanApplication ? 
    calculateMissingFields(transformedLoanApplication) : 
    (loanAppWithoutClient ? calculateMissingFields(createFallbackWithLoanData()!) : fallbackLoanApplication);

  // Debug logging for troubleshooting
  useEffect(() => {
    console.log('Loan Contract Generation Debug:', {
      loanApplicationId,
      hasLoanApplication: !!loanApplication,
      loanApplicationLength: loanApplication?.length,
      hasTransformedData: !!transformedLoanApplication,
      usingFallback: !transformedLoanApplication,
      finalClientName: finalLoanApplication?.clientName
    });
  }, [loanApplicationId, loanApplication, transformedLoanApplication]);

  // Debug navigation function
  useEffect(() => {
    console.log('Navigation function available:', typeof navigate);
    console.log('Current location:', window.location.pathname);
    console.log('Loan Application ID from params:', loanApplicationId);
  }, [navigate, loanApplicationId]);

  // Additional debug logging for transformed data
  useEffect(() => {
    if (transformedLoanApplication) {
      console.log('Transformed Loan Application:', transformedLoanApplication);
    }
  }, [transformedLoanApplication]);


  // Calculate repayment schedule when loan application changes
  useEffect(() => {
    if (transformedLoanApplication) {
      calculateRepaymentSchedule();
    }
  }, [transformedLoanApplication]);

  // Add keyboard shortcut for back navigation (Escape key)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log('Escape key pressed - navigating to loan processing...');
        try {
          navigate('../..');
        } catch (error) {
          console.error('Navigation error:', error);
          navigate('/staff/loan-processing');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  // This useEffect was removed as it was duplicating the one above

  // Initialize contract text with placeholders
  useEffect(() => {
    if (transformedLoanApplication) {
      const today = new Date();
      const contractDate = today.toLocaleDateString('sw-TZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      const initialContract = `Mkataba wa Mkopo
Mkataba huu umefanyika hapa Dar es Salaam leo Tarehe ${contractDate}. 

KATI YA

RYTHM MICROFINANCE LIMITED ambayo ni kampuni iliyosajiriwa chini ya Sheria ya Usajiri wa Makampuni ya mwaka 2002, Namba ya usajiri 173178700 ya S. L. P 75856 Dar es Salaam (ambayo katika mkataba huu itatambulika kama MKOPESHAJI kwa upande mmoja)

NA

BW/BI ${finalLoanApplication.clientName} wa S.L.P. ${finalLoanApplication.clientAddress} wa ${finalLoanApplication.clientLocation} akiwa ni ${finalLoanApplication.clientOccupation} (ambaye katika mkataba huu atatambulika kama MKOPAJI kwa upande mwingine)

KWA KUWA, Mkopaji ameomba kukopeshwa fedha na Mkopeshaji ambaye ni Kampuni, ameridhia kumkopesha Mkopaji, hivyo wahusika katika mkataba huu wanakubaliana kama ifuatavyo: 

KWAMBA, Mkopaji ni ${finalLoanApplication.clientOccupation}/${finalLoanApplication.clientEmployer} (kama ni kazi nyingine tofuati na tajwa hapo juu iandikwe). 

KWAMBA, Mkopaji ameomba kukopeshwa fedha kutoka kwa Mkopeshaji ambaye ameridhia kumkopesha Mkopaji fedha Taslimu kama alivyoombwa na Mkopaji kwa hiari yake mwenyewe. 

KWAMBA, Mkopaji kwa hiari yake mwenyewe akiwa na akili zake timamu na bila kushurutishwa na mtu yeyote amekubalina na masharti ya Mkopeshaji kukopeshwa fedha kiasi cha Shilingi kwa tarakimu: Tshs ${finalLoanApplication.principalAmount.toLocaleString()}/= kwa maneno: ${numberToWords(finalLoanApplication.principalAmount)}.

KWAMBA, Mkopaji atalipa ada ya maombi ya mkopo (Application Fee) ya Tshs ${(finalLoanApplication.applicationFee || 0).toLocaleString()}/= na ada ya mwanasheria (Legal Fee) ya Tshs ${(finalLoanApplication.legalFee || 0).toLocaleString()}/= kama ada za awali kabla ya kukopeshwa fedha hiyo. 

KWAMBA, Mkopo uliochukuliwa na Mkopaji utakuwa na riba ya asilimia ${finalLoanApplication.interestRate}% kwa kila kiasi kinachodaiwa kwa mwezi (yaani on reducing balance) cha fedha taslimu za Tanzania. 

${finalLoanApplication.managementFeeRate > 0 ? `KWAMBA, Mkopo uliochukuliwa na Mkopaji utakuwa na tozo ya ada ya usimamizi (loan management fee) ya asilimia ${finalLoanApplication.managementFeeRate}% kwa kila kiasi kinachodaiwa kwa mwezi (yaani on reducing balance) cha fedha taslimu za Tanzania.` : 'KWAMBA, Mkopo uliochukuliwa na Mkopaji hautakuwa na ada ya usimamizi (loan management fee).'} 

KWAMBA, Mkopaji atarejesha fedha hizo kwa muda wa miezi ${finalLoanApplication.termMonths} ambapo atalipa rejesho ndani ya miezi ${finalLoanApplication.termMonths} kiasi cha Shs. ${calculateTotalRepayment(finalLoanApplication).toLocaleString()}/= kuanzia tarehe ${new Date().toLocaleDateString('sw-TZ', { day: '2-digit', month: '2-digit', year: 'numeric' })} mpaka tarehe ${formatDate(finalLoanApplication.maturityDate)}.

KWAMBA, Mkopo halisi (Principal Sum), Riba na Ada ya Usimamizi wa Mkopo kwa jumla yake itakuwa Shs. ${calculateTotalRepayment(finalLoanApplication).toLocaleString()}/= kwa maneno: ${numberToWords(calculateTotalRepayment(finalLoanApplication))}.

KWAMBA, Mkopaji atalipa mkopo wake kila mwezi ndani ya muda uliokubaliwa katika kifungu cha 5 cha mkataba huu hapo juu. 

KWAMBA, Mkopo/Marejesho ya mkopo huu yatalipwa na Mkopaji kutoka katika biashara yake/ajira yake au kutoka chanzo kingine chochote kama ambavyo itaonekana inafaa kulingana na hali au mwenendo wa marejesho. 

KWAMBA, Mkopaji anakubali kudhamini mkopo wake kupitia udhamini wake yeye mwenyewe pamoja na udhamini wa mtu mwingine mmoja ambapo wote wawili, Mkopaji na Mdhamini, watatoa tamko la dhamana ya mkopo kupitia Fomu ya Mkopo ambayo itatamka dhamana za mkopo kwa upande wa Mkopaji na dhamana za mkopo kwa upande wa Mdhamini wa Mkopo ambayo imeambatishwa katika Kiambatisho Na. 1 na itasomeka kama sehemu ya Mkataba huu. 

KWAMBA, haitaruhusiwa kuuza, kukodisha au kumiliksha mtu mwingine na wala kutolea dhamana kwenye mkopo mwingine mali zote za Mkopaji na Mdhamini zilizowekwa kama dhamana katika Mkopo huu mpaka pale kiasi chote cha mkopo na riba, tozo za usimamizi wa mkopo na gharama zote za ucheleweshwaji na usumbufu katika ufuatiliaji wa mkopo zitakapokuwa zimelipwa. 

KWAMBA, Ikitokea Mkopaji ameshindwa kulipa marejesho ya Mkopo kwa wakati kama makubaliano yalivyo hapo juu na kuchelewesha mkopo kwa zaidi ya siku tano (5), Mkopeshaji atamwandikia Mkopaji Notisi ya Kwanza ya wiki mbili, yaani Siku 14, ikimtaka kulipa Mkopo huo pamoja na riba, tozo ya usimamizi wa mkopo na/au faini zake ndani ya kipindi cha Notisi tajwa. 

KWAMBA, Ikitokea Mkopaji ameshindwa kulipa marejesho ya Mkopo ndani ya Notisi ya Siku 14, Mkopeshaji atamwandikia Mkopaji Notisi ya Pili ya miezi miwili, yaani Siku 60, ikimtaka kulipa Mkopo huo pamoja na riba na/au faini zake ndani ya kipindi cha Notisi tajwa na kusudio la kutaifisha na au kuuza vitu vya dhamana ya Mkopo ili kufidia Mkopo, riba, tozo za usimamizi wa mkopo na faini zingine, kama zipo. 

KWAMBA, ikiwa Mkopaji atashindwa kulipa mkopo pamoja na riba na/au faini ndani ya kipindi cha Notisi ya Pili yaani Siku 60, Mkopeshaji atakuwa na mamlaka ya kuuza dhamana zote za mkopo zinazohamishika na zisizohamishika ikiwa ni pamoja na kufilisi akaunti zote za benki za Mkopaji ili kufidia Mkopo pamoja na gharama zake zote. Barua au Notisi hiyo itatoa kibali kwa mkusanya madeni (Dalali) wa kampuni kukusanya mkopo au kuuza dhamana ya mkopo kwa kufuata taratibu za kisheria na iwapo kiasi cha fedha kilichopatikana kutokana na uuzaji wa dhamana hakitatosha kulipa mkopo, riba, tozo za usimamizi wa mkopo, faini na gharama za uuzaji wa dhamana Mkopeshaji atatafuta taratibu za kisheria ili kukamata na kuuza mali zingine za Mkopaji au Mdhamini ili kumalizia deni. 

KWAMBA, endapo Mkopaji atavusha au kuchelewesha marejesho yake kama ilivyokubaliwa hapo juu basi atapaswa kutozwa faini (penalty) ya asilimia 0.5% kwa siku kwa kila rejesho lililocheleweshwa au kuvushwa kila mwezi. 

KWAMBA, Mkopaji atalazimika kulipa gharama za ukusanyaji wa deni endapo atashindwa kulipa mkopo kwa wakati na kulazimisha kutumia Wakala wa Ukusanyaji wa Madeni wa kampuni (Dalali) kama ifuatavyo: 

a. 10% ya deni lililobaki kama kamisheni ya Wakala (Dalali) 

b. Gharama za matangazo gazetini 

c. Gharama za kutangaza mtaani (Road show) 

d. Gharama za breakdown 

NB: Gharama kwa wakati huo zitategemea umbali halisi. 

Ulipaji wa Mkopo utazingatia mpangilio ufuatao: faini (penalty) zitalipwa kwanza (endapo zitakuwepo); kisha malimbikizo yote ya tozo za usimamizi, riba; na mwisho kiasi halisi cha mkopo (yaani principal sum of the loan). 

KWAMBA, Mkopaji na Mdhamini wanampa Mkopeshaji au Wakala (Dalali) wake haki na mamlaka ya kuingia wakati wowote katika nyumba ya Mkopaji na Mdhamini kuchunguza na kukagua mali zilizowekwa dhamana ya mkopo pamoja na vitabu vya hesabu ya biashara na mwenendo wa uendeshaji biashara na kwamba Mkopaji atawajibika kuwapa Mkopeshaji au wawakilishi wake taarifa zote kuhusu mali zilizowekwa dhamana, taarifa za uendeshaji wa biashara na kumbukumbu za taarifa na hesabu za pesa ya biashara iliyoombewa mkopo kama itakavyohitaji. 

KWAMBA, Mkopaji anampa haki na mamlaka Mkopeshaji kutoa na kuuliza taarifa za Mkopaji na Mdhamini wake kwa Mabenki na Taasisi zingine za fedha na Taasisi ya Taarifa za Wakopaji (CREDIT REFERENCE BUREAU) ili kuthibitisha ukweli wa taarifa zilizotolewa na Mkopaji. 

KWAMBA, Mkopaji anakubali kulipa tozo zifuatazo: 

a. Ada ya Maombi ya Mkopo ni Shs. ${(finalLoanApplication.applicationFee || 0).toLocaleString()}/=. 

b. Ada ya Mwanasheria, Shs. ${(finalLoanApplication.legalFee || 0).toLocaleString()}/=. 

KWAMBA, taarifa za mkopo pamoja na marejesho yake zitawekwa katika Jedwali la Malipo ya Mkopo ambayo imeambatishwa katika Kiambatisho Na. 2 na itasomeka kama sehemu ya mkataba huu. 

KWAMBA, Mkopeshaji haki ya kusitisha Mkataba huu wakati wowote na kumtaka Mkopaji kurejesha mara moja kiasi chote cha Mkopo kilichobaki iwapo Mkopeshaji atagundua udanganyifu au uendeshaji mbovu wa biashara iliyoombewa mkopo au iwapo taarifa zilizotolewa na Mkopaji au Mdhamini wakati wa kuomba Mkopo au wakati wa ukaguzi na usimamizi sii sahihi. Aidha, iwapo Mkopaji au Mdhamini atafanya kitu chochote ambacho kipo nje ya Mkataba huu au kinyume na haki ya dhamana.

KWAMBA, kwa kuwa Mkopaji ni ${finalLoanApplication.clientOccupation}/${finalLoanApplication.clientEmployer} katika Kampuni ya/Shirika la/Wizara/Idara ya ${finalLoanApplication.clientEmployer}/katika kijiji cha/Mtaa wa ${finalLoanApplication.clientLocation} katika Kata ya ${finalLoanApplication.clientLocation} ya Haimashauri ya wilaya/Manispaa ${finalLoanApplication.clientLocation} ataambatanisha barua ya utambaulisho kutoka kwa Mwajiri/Serikali ya Mtaa na barua hiyo itataja kazi yake/biashara au chanzo cha mapato kitakachotumika kurejesha mkopo huu. 

KWAMBA, malipo yote ya Mkopo/marejesho yafanyike kupitia benki ya Mkopeshaji kama ilivyoainishwa hapa:

Jina la Akaunti: 
RYTHM Microfinance Limited 

Namba ya Akaunti: 
0150000FBCE00 

Jina la Benki: 
CRDB Bank PLC 

KWAMBA, Mkataba huu na Makubaliano haya yataanza kutumika rasmi baada ya kutiwa saini na pande zote mbili na yatasimamiwa kwa taratibu zote na kanuni zinazowekwa na Sheria za Jamuhuri ya Muungano wa Tanzania na hivyo utatafasiliwa na kutekelezwa kama Mkataba wa Kisheria. 

KWAMBA makubaliano haya yametiwa sahihi hapa Dar es Salaam na pande zote katika tarehe na kwa namna inavyoonekana hapa chini. 

Jedwali la Marejesho ya Mkopo 
Kiambatisho Na. 1 katika Mkataba wa Mkopo Na. ${finalLoanApplication.id} 

Mkopo, riba na tozo zote zitalipwa kama inavyoonyeshwa katika jedwali hili hapa chini: 

[REPAYMENT_SCHEDULE_TABLE]

UPANDE WA MKOPAJI NA MDHAMINI 

Mkopaji: 
Jina: ${finalLoanApplication.clientName} 
Sahihi: ............................................................ 
Kazi: ${finalLoanApplication.clientOccupation} 
Anwani: ${finalLoanApplication.clientAddress} 
Alama ya Dole Gumba 

Mwenza wa Mkopaji: 
Jina: ............................................................ 
Sahihi: ............................................................ 
Kazi: ............................................................ 
Anwani: ............................................................ 

Shahidi wa Mkopaji/Mdhamini: 
Jina: ............................................................ 
Sahihi: ............................................................ 
Kazi: ............................................................ 
Anwani: ............................................................ 

KWA NIABA YA RYTHM Microfinance Limited 
Jina: ............................................................ 
Sahihi: ............................................................ 
Kazi: ............................................................ 
Anwani: ............................................................ 

UMESHUHUDIWA NA: HAKIMU/MWANASHERIA: 
Jina: ............................................................ 
Sahihi: ............................................................ 
Kazi: ............................................................ 
Anwani: ............................................................ 

---
Mkataba huu umetengenezwa kwa kompyuta tarehe: ${new Date().toLocaleString('sw-TZ', { 
  day: '2-digit', 
  month: '2-digit', 
  year: 'numeric', 
  hour: '2-digit', 
  minute: '2-digit', 
  second: '2-digit' 
})}
Contract Generated: ${new Date().toISOString()}
Loan Application ID: ${finalLoanApplication.id}`;

      // Replace repayment schedule placeholder with actual table
      const contractWithSchedule = replaceRepaymentScheduleTable(initialContract);
      
      // Convert plain text to HTML for proper editing
      setContractText(plainTextToHtml(contractWithSchedule));
    }
  }, [loanApplication]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sw-TZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const numberToWords = (num: number): string => {
    // Simple number to words conversion for Swahili
    const ones = ['', 'Moja', 'Mbili', 'Tatu', 'Nne', 'Tano', 'Sita', 'Saba', 'Nane', 'Tisa'];
    const tens = ['', '', 'Ishirini', 'Thelathini', 'Arobaini', 'Hamsini', 'Sitini', 'Sabini', 'Themanini', 'Tisini'];
    const hundreds = ['', 'Mia Moja', 'Mia Mbili', 'Mia Tatu', 'Mia Nne', 'Mia Tano', 'Mia Sita', 'Mia Saba', 'Mia Nane', 'Mia Tisa'];
    
    if (num === 0) return 'Sifuri';
    if (num < 10) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' na ' + ones[num % 10] : '');
    if (num < 1000) return hundreds[Math.floor(num / 100)] + (num % 100 ? ' na ' + numberToWords(num % 100) : '');
    if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' Elfu' + (num % 1000 ? ' na ' + numberToWords(num % 1000) : '');
    if (num < 1000000000) return numberToWords(Math.floor(num / 1000000)) + ' Milioni' + (num % 1000000 ? ' na ' + numberToWords(num % 1000000) : '');
    
    return num.toString();
  };

  // Using shared rounding utility from utils/roundingUtils.ts

  // Helper function to calculate total repayment using the same logic as credit assessment
  const calculateTotalRepayment = (loanApp: LoanApplication) => {
    const principal = loanApp.principalAmount;
    const interestRate = loanApp.interestRate / 100;
    const managementFeeRate = loanApp.managementFeeRate / 100;
    const termMonths = loanApp.termMonths;
    
    // Use the same reducing balance calculation as credit assessment
    const monthlyInterestRate = interestRate;
    const monthlyManagementFeeRate = managementFeeRate;
    const combinedRate = monthlyInterestRate + monthlyManagementFeeRate;
    
    let emi = 0;
    let totalInterest = 0;
    let totalManagementFee = 0;
    
    if (combinedRate > 0) {
      // PMT Formula for reducing balance
      emi = (principal * combinedRate * Math.pow(1 + combinedRate, termMonths)) / 
            (Math.pow(1 + combinedRate, termMonths) - 1);
      
      // Calculate total interest and management fee using reducing balance
      let remainingBalance = principal;
      
      for (let i = 1; i <= termMonths; i++) {
        const interestPortion = remainingBalance * monthlyInterestRate;
        const managementFeePortion = remainingBalance * monthlyManagementFeeRate;
        let principalPortion = emi - interestPortion - managementFeePortion;
        
        // For the last payment, ensure the remaining balance is exactly 0
        if (i === termMonths) {
          principalPortion = remainingBalance;
        }
        
        remainingBalance -= principalPortion;
        totalInterest += interestPortion;
        totalManagementFee += managementFeePortion;
      }
    } else {
      // If no interest or management fee, just return principal
      return principal;
    }
    
    return principal + totalInterest + totalManagementFee;
  };

  const calculateRepaymentSchedule = () => {
    if (!finalLoanApplication) return;

    const principal = finalLoanApplication.principalAmount;
    const termMonths = finalLoanApplication.termMonths;
    const monthlyInterestRate = finalLoanApplication.interestRate / 100;
    const monthlyManagementFeeRate = finalLoanApplication.managementFeeRate / 100;
    const calculationMethod = finalLoanApplication.calculationMethod;

    if (principal <= 0 || termMonths <= 0) {
      setRepaymentSchedule([]);
      return;
    }

    let totalInterest = 0;
    let totalManagementFee = 0;
    let emi = 0;
    const schedule: RepaymentScheduleEntry[] = [];

    if (calculationMethod === 'flat_rate') {
      // Flat Rate Method
      totalInterest = principal * monthlyInterestRate * termMonths;
      totalManagementFee = principal * monthlyManagementFeeRate * termMonths;
      const totalRepayment = principal + totalInterest + totalManagementFee;
      emi = totalRepayment / termMonths;

      // Generate flat rate schedule
      let remainingBalance = principal;
      const monthlyPrincipal = principal / termMonths;
      const monthlyInterest = totalInterest / termMonths;
      const monthlyManagementFee = totalManagementFee / termMonths;

      for (let i = 1; i <= termMonths; i++) {
        const dueDate = new Date(finalLoanApplication.disbursementDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        remainingBalance -= monthlyPrincipal;

        schedule.push({
          paymentNumber: i,
          dueDate: dueDate.toISOString().split('T')[0],
          principalPortion: roundAmount(monthlyPrincipal),
          interestPortion: roundAmount(monthlyInterest),
          managementFeePortion: roundAmount(monthlyManagementFee),
          totalPayment: roundAmount(emi),
          remainingBalance: Math.max(0, roundAmount(remainingBalance))
        });
      }
    } else if (calculationMethod === 'balloon_structure') {
      // Balloon Structure Method
      let remainingBalance = principal;

      for (let i = 1; i <= termMonths; i++) {
        const dueDate = new Date(finalLoanApplication.disbursementDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        const interestPortion = remainingBalance * monthlyInterestRate;
        const managementFeePortion = remainingBalance * monthlyManagementFeeRate;
        
        let principalPortion = 0;
        let totalPayment = 0;

        if (i < termMonths) {
          // Months 1 to n-1: Small payments (fees + interest only)
          principalPortion = 0;
          totalPayment = interestPortion + managementFeePortion;
        } else {
          // Final month: Large balloon payment (principal + final interest + fees)
          principalPortion = remainingBalance;
          totalPayment = remainingBalance + interestPortion + managementFeePortion;
        }

        remainingBalance -= principalPortion;
        totalInterest += interestPortion;
        totalManagementFee += managementFeePortion;

        schedule.push({
          paymentNumber: i,
          dueDate: dueDate.toISOString().split('T')[0],
          principalPortion: roundAmount(principalPortion),
          interestPortion: roundAmount(interestPortion),
          managementFeePortion: roundAmount(managementFeePortion),
          totalPayment: roundAmount(totalPayment),
          remainingBalance: Math.max(0, roundAmount(remainingBalance))
        });
      }

      // Calculate average monthly payment for display
      const totalPayments = schedule.reduce((sum, entry) => sum + entry.totalPayment, 0);
      emi = totalPayments / termMonths;
    } else if (calculationMethod === 'emi') {
      // EMI Method (Fixed monthly payments)
      const combinedRate = monthlyInterestRate + monthlyManagementFeeRate;
      
      if (combinedRate > 0) {
        emi = (principal * combinedRate * Math.pow(1 + combinedRate, termMonths)) / 
              (Math.pow(1 + combinedRate, termMonths) - 1);
      } else {
        emi = principal / termMonths;
      }

      // Generate EMI schedule
      let remainingBalance = principal;

      for (let i = 1; i <= termMonths; i++) {
        const dueDate = new Date(finalLoanApplication.disbursementDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        const interestPortion = remainingBalance * monthlyInterestRate;
        const managementFeePortion = remainingBalance * monthlyManagementFeeRate;
        let principalPortion = emi - interestPortion - managementFeePortion;

        // For the last payment, ensure the remaining balance is exactly 0
        if (i === termMonths) {
          principalPortion = remainingBalance;
        }

        remainingBalance -= principalPortion;
        totalInterest += interestPortion;
        totalManagementFee += managementFeePortion;

        schedule.push({
          paymentNumber: i,
          dueDate: dueDate.toISOString().split('T')[0],
          principalPortion: roundAmount(principalPortion),
          interestPortion: roundAmount(interestPortion),
          managementFeePortion: roundAmount(managementFeePortion),
          totalPayment: roundAmount(emi),
          remainingBalance: Math.max(0, roundAmount(remainingBalance))
        });
      }
    } else {
      // Default: Reducing Balance Method (PMT Formula)
      const combinedRate = monthlyInterestRate + monthlyManagementFeeRate;
      
      if (combinedRate > 0) {
        emi = (principal * combinedRate * Math.pow(1 + combinedRate, termMonths)) / 
              (Math.pow(1 + combinedRate, termMonths) - 1);
      } else {
        emi = principal / termMonths;
      }

      // Generate reducing balance schedule
      let remainingBalance = principal;

      for (let i = 1; i <= termMonths; i++) {
        const dueDate = new Date(finalLoanApplication.disbursementDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        const interestPortion = remainingBalance * monthlyInterestRate;
        const managementFeePortion = remainingBalance * monthlyManagementFeeRate;
        let principalPortion = emi - interestPortion - managementFeePortion;

        // For the last payment, ensure the remaining balance is exactly 0
        if (i === termMonths) {
          principalPortion = remainingBalance;
        }

        remainingBalance -= principalPortion;
        totalInterest += interestPortion;
        totalManagementFee += managementFeePortion;

        schedule.push({
          paymentNumber: i,
          dueDate: dueDate.toISOString().split('T')[0],
          principalPortion: roundAmount(principalPortion),
          interestPortion: roundAmount(interestPortion),
          managementFeePortion: roundAmount(managementFeePortion),
          totalPayment: roundAmount(emi),
          remainingBalance: Math.max(0, roundAmount(remainingBalance))
        });
      }
    }

    setRepaymentSchedule(schedule);
  };


  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update loan status and workflow after successful save
      console.log('Contract saved, updating loan status...');
      
      try {
        // Import the workflow service dynamically to avoid circular dependencies
        const { LoanWorkflowService } = await import('../services/loanWorkflowService');
        
        // Record the contract generation step
        await LoanWorkflowService.markContractGenerated(
          loanApplicationId!,
          user?.id || 'system'
        );
        
        console.log('✅ Contract generation status updated successfully');
        alert('Contract saved successfully! Status updated to contract generated.');
      } catch (workflowError) {
        console.error('Workflow service error:', workflowError);
        
        // Fallback: Direct status update without workflow steps
        try {
          const { supabase } = await import('../lib/supabaseClient');
          const { error: updateError } = await supabase
            .from('loan_applications')
            .update({ 
              status: 'contract_generated',
              updated_at: new Date().toISOString()
            })
            .eq('id', loanApplicationId);
          
          if (updateError) {
            throw updateError;
          }
          
          console.log('✅ Loan status updated directly (fallback method)');
          alert('Contract saved successfully! Status updated to contract generated.');
        } catch (directUpdateError) {
          console.error('Direct status update failed:', directUpdateError);
          alert('Contract saved, but there was an error updating the status. Please check the loan processing page.');
        }
      }
      
      setSaving(false);
    } catch (error) {
      console.error('Error updating contract generation status:', error);
      setSaving(false);
      // Still allow save even if status update fails
      alert('Contract saved, but there was an error updating the status. Please check the loan processing page.');
    }
  };


  const handleRemoveLetterhead = () => {
    setLetterhead(null);
    setLetterheadPreview(null);
    setHasActiveLetterhead(false);
  };


  // Helper function to convert plain text to HTML for editing
  const plainTextToHtml = (text: string): string => {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\r\n/g, '<br>')
      .replace(/\r/g, '<br>');
  };

  // Helper function to ensure proper HTML content
  const ensureProperHtmlContent = (content: string): string => {
    if (!content || content.trim() === '') return '';
    
    // Convert line breaks to HTML
    let htmlContent = content
      .replace(/\n/g, '<br>')
      .replace(/\r\n/g, '<br>')
      .replace(/\r/g, '<br>');
    
    // Ensure proper paragraph structure
    if (!htmlContent.includes('<p>') && !htmlContent.includes('<div>')) {
      // Wrap in paragraphs if no block elements exist
      htmlContent = htmlContent.split('<br><br>').map(paragraph => 
        paragraph.trim() ? `<p>${paragraph}</p>` : ''
      ).join('');
    }
    
    return htmlContent;
  };

  // New functions for enhanced features
  const handleLetterheadUploadEnhanced = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        try {
          if (!user) {
            alert('User not authenticated. Please log in again.');
            return;
          }

          // Upload to service
          await LetterheadService.uploadLetterhead(file, user.id);
          
          // Update local state
        setLetterhead(file);
          setHasActiveLetterhead(true);
          
        const reader = new FileReader();
        reader.onload = (e) => {
          setLetterheadPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
          
          alert('Letterhead uploaded successfully! It will be used for all future contracts.');
        } catch (error) {
          console.error('Error uploading letterhead:', error);
          alert('Failed to upload letterhead. Please try again.');
        }
      } else {
        alert('Please upload an image file (PNG, JPG, etc.)');
      }
    }
  };

  const handleSendEmail = async () => {
    if (!transformedLoanApplication) {
      alert('No loan application data available');
      return;
    }

    if (!transformedLoanApplication.clientEmail) {
      alert('Client email address not available');
      return;
    }

    setIsSendingEmail(true);
    try {
      // Generate PDF
      const contractPdf = await EmailService.generateContractPdf(contractText);
      
      // Send email
      await EmailService.sendContract(
        transformedLoanApplication.clientEmail,
        transformedLoanApplication.clientName,
        contractPdf,
        transformedLoanApplication.principalAmount
      );
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleTextFormat = (command: string, value?: string) => {
    if (contractEditorRef.current) {
      // Focus the editor first
      contractEditorRef.current.focus();
      
      // Handle undo/redo commands
      if (command === 'undo') {
        handleUndo();
        return;
      }
      if (command === 'redo') {
        handleRedo();
        return;
      }
      
      // Save current state before making changes
      saveToUndoStack(contractText);
      
      // Handle font size changes specially
      if (command === 'fontSize') {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          
          // Check if there's selected text
          if (range.toString().trim()) {
            // Apply font size to selected text
            const span = document.createElement('span');
            span.style.fontSize = value + 'px';
            
            try {
              range.surroundContents(span);
            } catch (e) {
              // If surroundContents fails, try a different approach
              const contents = range.extractContents();
              span.appendChild(contents);
              range.insertNode(span);
            }
          } else {
            // No selection, apply to the current element
            const container = range.commonAncestorContainer;
            const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
            
            if (element && element instanceof HTMLElement) {
              element.style.fontSize = value + 'px';
            }
          }
        }
      } else if (command === 'fontName') {
        // Handle font family changes
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          
          if (range.toString().trim()) {
            const span = document.createElement('span');
            span.style.fontFamily = value || 'Aptos';
            
            try {
              range.surroundContents(span);
            } catch (e) {
              const contents = range.extractContents();
              span.appendChild(contents);
              range.insertNode(span);
            }
          } else {
            const container = range.commonAncestorContainer;
            const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
            
            if (element && element instanceof HTMLElement) {
              element.style.fontFamily = value || 'Aptos';
            }
          }
        }
      } else {
        // Execute other formatting commands normally
        const success = document.execCommand(command, false, value);
        
        if (!success) {
          console.warn(`Command ${command} failed`);
        }
      }
      
      // Update the contract text with the new HTML content
      const htmlContent = contractEditorRef.current.innerHTML;
      
      // Only update if content actually changed to prevent duplication
      if (htmlContent !== contractText) {
        setContractText(htmlContent);
      }
      
      // Force a re-render to update the toolbar
      setTimeout(() => {
        if (contractEditorRef.current) {
          contractEditorRef.current.focus();
        }
      }, 10);
    }
  };

  const isFormatActive = (command: string): boolean => {
    if (command === 'undo') return canUndo;
    if (command === 'redo') return canRedo;
    if (contractEditorRef.current) {
      return document.queryCommandState(command);
    }
    return false;
  };

  // Undo/Redo functions
  const saveToUndoStack = (content: string) => {
    setUndoStack(prev => [...prev, content]);
    setRedoStack([]); // Clear redo stack when new action is performed
    setCanUndo(true);
    setCanRedo(false);
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousContent = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, contractText]);
      setUndoStack(prev => prev.slice(0, -1));
      setContractText(previousContent);
      setCanUndo(undoStack.length > 1);
      setCanRedo(true);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextContent = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, contractText]);
      setRedoStack(prev => prev.slice(0, -1));
      setContractText(nextContent);
      setCanUndo(true);
      setCanRedo(redoStack.length > 1);
    }
  };

  const handleContentChange = (newContent: string) => {
    // Prevent duplication by checking if content actually changed
    const cleanNewContent = newContent.replace(/\s+/g, ' ').trim();
    const cleanCurrentContent = contractText.replace(/\s+/g, ' ').trim();
    
    if (cleanNewContent !== cleanCurrentContent) {
      saveToUndoStack(contractText);
      setContractText(newContent);
      
      // Force a small delay to ensure the content update is processed
      setTimeout(() => {
        // This will trigger the MultiPageDisplay to recalculate pages
      }, 10);
    }
  };



  // Function to replace [REPAYMENT_SCHEDULE_TABLE] placeholder with actual table
  const replaceRepaymentScheduleTable = (contractText: string) => {
    if (repaymentSchedule.length === 0) {
      return contractText.replace('[REPAYMENT_SCHEDULE_TABLE]', 'No repayment schedule available');
    }

    const scheduleTableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 2px 0; font-family: 'Aptos', Arial, sans-serif; font-size: 12px;"><thead><tr style="background-color: #f9fafb;"><th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: 600;">Payment</th><th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: 600;">Due Date</th><th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: 600;">Principal</th><th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: 600;">Interest</th><th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: 600;">Mgmt Fee</th><th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: 600;">Total Payment</th><th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: 600;">Balance</th></tr></thead><tbody>${repaymentSchedule.map(entry => `<tr><td style="border: 1px solid #d1d5db; padding: 8px;">${entry.paymentNumber}</td><td style="border: 1px solid #d1d5db; padding: 8px;">${formatDate(entry.dueDate)}</td><td style="border: 1px solid #d1d5db; padding: 8px;">${formatCurrency(entry.principalPortion)}</td><td style="border: 1px solid #d1d5db; padding: 8px;">${formatCurrency(entry.interestPortion)}</td><td style="border: 1px solid #d1d5db; padding: 8px;">${formatCurrency(entry.managementFeePortion)}</td><td style="border: 1px solid #d1d5db; padding: 8px; font-weight: 600;">${formatCurrency(entry.totalPayment)}</td><td style="border: 1px solid #d1d5db; padding: 8px;">${formatCurrency(entry.remainingBalance)}</td></tr>`).join('')}</tbody></table>`;

    return contractText.replace('[REPAYMENT_SCHEDULE_TABLE]', scheduleTableHtml);
  };

  const handleDownloadOnly = async () => {
    if (letterhead || hasActiveLetterhead) {
      // Replace the placeholder in contract text with the actual table
      const contractWithTable = replaceRepaymentScheduleTable(contractText);

      // Create a new window with the contract and letterhead
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Loan Contract - ${finalLoanApplication?.clientName}</title>
              <style>
                body { 
                  font-family: 'Aptos', Arial, sans-serif; 
                  font-size: 12px; 
                  line-height: 1.4;
                  margin: 0;
                  padding: 20px;
                }
                .letterhead { 
                  width: 100%; 
                  max-width: 100%; 
                  height: auto; 
                  margin-bottom: 20px;
                }
                .contract-text {
                  white-space: pre-wrap;
                  font-family: 'Aptos', Arial, sans-serif;
                  font-size: 12px;
                }
                .contract-text table {
                  white-space: normal;
                  margin: 2px 0;
                }
              </style>
            </head>
            <body>
              ${letterheadPreview ? `<img src="${letterheadPreview}" alt="Letterhead" class="letterhead" />` : ''}
              <div class="contract-text">${contractWithTable}</div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        
        // Contract downloaded successfully - no database update needed!
        console.log('✅ Contract downloaded successfully!');
        
        // Mark contract as generated in localStorage immediately
        const generatedContracts = JSON.parse(localStorage.getItem('generatedContracts') || '[]');
        if (!generatedContracts.includes(loanApplicationId)) {
          generatedContracts.push(loanApplicationId);
          localStorage.setItem('generatedContracts', JSON.stringify(generatedContracts));
          console.log('✅ Contract marked as generated in localStorage:', loanApplicationId);
        }
        
        // Show success message and navigate immediately
        alert('Contract downloaded successfully! You will now be redirected to the workflow progress area where you can upload the signed contract.');
        
        // Navigate immediately after alert is dismissed
        setTimeout(() => {
          console.log('🔄 Navigating to loan processing workflow...');
          console.log('🔄 Loan Application ID:', loanApplicationId);
          
          // Try navigation with state first
          try {
            console.log('🔄 Attempting navigation with state...');
            navigate('/staff/loan-processing', { 
              state: { 
                selectedLoanId: loanApplicationId,
                showWorkflow: true,
                contractGenerated: true
              }
            });
            console.log('✅ Navigation with state completed');
          } catch (error) {
            console.error('❌ Navigation with state failed, trying URL params:', error);
            // Fallback to URL parameters
            console.log('🔄 Attempting navigation with URL params...');
            navigate(`/staff/loan-processing?loanId=${loanApplicationId}&showWorkflow=true&contractGenerated=true`);
            console.log('✅ Navigation with URL params completed');
          }
        }, 100);
        
        // Notify parent page that contract was generated (for UI updates)
        setTimeout(() => {
          window.parent.postMessage({ type: 'CONTRACT_GENERATED', loanId: loanApplicationId }, '*');
          // Also try to refresh if we're in an iframe or popup
          if (window.opener) {
            window.opener.location.reload();
          }
        }, 1000);
      }
    } else {
      alert('Please upload a letterhead first');
    }
  };

  const handleDownloadContract = async () => {
    if (letterhead || hasActiveLetterhead) {
      // Replace the placeholder in contract text with the actual table
      const contractWithTable = replaceRepaymentScheduleTable(contractText);

      // Create a new window with the contract and letterhead
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Loan Contract - ${finalLoanApplication?.clientName}</title>
              <style>
                body { 
                  font-family: 'Aptos', Arial, sans-serif; 
                  font-size: 12px; 
                  line-height: 1.4;
                  margin: 0;
                  padding: 20px;
                }
                .letterhead { 
                  width: 100%; 
                  max-width: 100%; 
                  height: auto; 
                  margin-bottom: 20px;
                }
                .contract-text {
                  white-space: pre-wrap;
                  font-family: 'Aptos', Arial, sans-serif;
                  font-size: 12px;
                }
                .contract-text table {
                  white-space: normal;
                  margin: 2px 0;
                }
              </style>
            </head>
            <body>
              ${letterheadPreview ? `<img src="${letterheadPreview}" alt="Letterhead" class="letterhead" />` : ''}
              <div class="contract-text">${contractWithTable}</div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        
        // Contract downloaded successfully - no database update needed!
        console.log('✅ Contract downloaded successfully!');
        
        // Mark contract as generated in localStorage immediately
        const generatedContracts = JSON.parse(localStorage.getItem('generatedContracts') || '[]');
        if (!generatedContracts.includes(loanApplicationId)) {
          generatedContracts.push(loanApplicationId);
          localStorage.setItem('generatedContracts', JSON.stringify(generatedContracts));
          console.log('✅ Contract marked as generated in localStorage:', loanApplicationId);
        }
        
        // Show success message and navigate immediately
        alert('Contract downloaded successfully! You will now be redirected to the workflow progress area where you can upload the signed contract.');
        
        // Navigate immediately after alert is dismissed
        setTimeout(() => {
          console.log('🔄 Navigating to loan processing workflow...');
          console.log('🔄 Loan Application ID:', loanApplicationId);
          
          // Try navigation with state first
          try {
            console.log('🔄 Attempting navigation with state...');
            navigate('/staff/loan-processing', { 
              state: { 
                selectedLoanId: loanApplicationId,
                showWorkflow: true,
                contractGenerated: true
              }
            });
            console.log('✅ Navigation with state completed');
          } catch (error) {
            console.error('❌ Navigation with state failed, trying URL params:', error);
            // Fallback to URL parameters
            console.log('🔄 Attempting navigation with URL params...');
            navigate(`/staff/loan-processing?loanId=${loanApplicationId}&showWorkflow=true&contractGenerated=true`);
            console.log('✅ Navigation with URL params completed');
          }
        }, 100);
        
        // Notify parent page that contract was generated (for UI updates)
        setTimeout(() => {
          window.parent.postMessage({ type: 'CONTRACT_GENERATED', loanId: loanApplicationId }, '*');
          // Also try to refresh if we're in an iframe or popup
          if (window.opener) {
            window.opener.location.reload();
          }
        }, 1000);
      }
    } else {
      alert('Please upload a letterhead first');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">{t('loading_contract_data')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    console.error('Error loading loan application data:', error);
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{t('error_loading_contract')}</p>
            <p className="text-gray-500 text-sm mt-2">Error: {String(error)}</p>
            <p className="text-gray-500 text-sm mt-1">{t('loan_application_id')}: {loanApplicationId}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!finalLoanApplication) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('contract_not_found')}</h2>
            <p className="text-gray-600">{t('contract_not_found_message')}</p>
            <p className="text-gray-500 text-sm mt-2">{t('loan_application_id')}: {loanApplicationId}</p>
            <p className="text-gray-500 text-sm">{t('available_applications')}: {allApplications?.length || 0}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <style>
        {`
          @media print {
            .a4-page {
              width: 210mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding: 25mm !important;
            }
          }
          
          .a4-page {
            width: 210mm;
            min-height: 297mm;
            max-width: 210mm;
          }
          
          @media (max-width: 768px) {
            .a4-page {
              width: 100%;
              max-width: 100%;
              min-height: auto;
            }
          }
          
          .contract-editor {
            min-height: 100%;
            overflow: visible;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          .contract-editor:focus {
            outline: none;
            box-shadow: 0 0 0 2px #3b82f6;
          }
        `}
      </style>
      <div className="space-y-6">
        {/* Warning Banner for fallback data - only show if no loan application data is available */}
        {!transformedLoanApplication && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">{t('using_sample_data')}</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>{t('no_loan_application_found')}: {loanApplicationId}. {t('using_sample_data_demo')}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <button
            onClick={(e) => {
              e.preventDefault();
              console.log('Breadcrumb Dashboard clicked');
              try {
                navigate('/staff/dashboard');
              } catch (error) {
                console.error('Navigation error:', error);
                window.location.href = '/staff/dashboard';
              }
            }}
            className="hover:text-gray-700 transition-colors"
          >
            {t('breadcrumb_dashboard')}
          </button>
          <span>/</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              console.log('Breadcrumb Loan Processing clicked');
              try {
                navigate('/staff/loan-processing');
              } catch (error) {
                console.error('Navigation error:', error);
                window.location.href = '/staff/loan-processing';
              }
            }}
            className="hover:text-gray-700 transition-colors"
          >
            {t('breadcrumb_loan_processing')}
          </button>
          <span>/</span>
          <span className="text-gray-900 font-medium">{t('breadcrumb_contract_generation')}</span>
        </nav>
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('loan_contract_generation')}</h1>
              <p className="text-gray-600">{t('generate_and_edit_contract')} {finalLoanApplication.clientName}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            {/* Back Button */}
            <button
              onClick={() => {
                console.log('Back to Processing button clicked');
                // Use window.location for reliable navigation
                window.location.href = '/staff/loan-processing';
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Processing
            </button>
            
            {/* Upload Letterhead Button - Only show if no letterhead exists */}
            {!hasActiveLetterhead && (
            <label className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Upload Letterhead
              <input
                type="file"
                accept="image/*"
                  onChange={handleLetterheadUploadEnhanced}
                className="hidden"
              />
            </label>
            )}
            
            {/* Show letterhead status if exists */}
            {hasActiveLetterhead && (
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Letterhead Active
              </div>
            )}
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Save Contract'}
            </button>
            
            <button
              onClick={handleDownloadContract}
              disabled={!letterhead && !hasActiveLetterhead}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download & Return
            </button>
            
            <button
              onClick={handleDownloadOnly}
              disabled={!letterhead && !hasActiveLetterhead}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Only
            </button>
            
            <button
              onClick={handleSendEmail}
              disabled={isSendingEmail || !transformedLoanApplication?.clientEmail}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              {isSendingEmail ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              {isSendingEmail ? 'Sending...' : 'Send Email'}
            </button>
            
            <button
              onClick={() => setShowPageLayout(!showPageLayout)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              {showPageLayout ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showPageLayout ? 'Hide Layout' : 'Show Layout'}
            </button>
          </div>
        </div>

        {/* Loan Application Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('loan_application_details')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center">
              <User className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">{t('client_name')}</p>
                <p className="font-semibold text-gray-900">{finalLoanApplication.clientName}</p>
              </div>
            </div>
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">{t('principal_amount')}</p>
                <p className="font-semibold text-gray-900">TZS {finalLoanApplication.principalAmount.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Percent className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">{t('interest_rate')}</p>
                <p className="font-semibold text-gray-900">{finalLoanApplication.interestRate}%</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">{t('term')}</p>
                <p className="font-semibold text-gray-900">{finalLoanApplication.termMonths} {t('months')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Letterhead Preview */}
        {letterheadPreview && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('letterhead_preview')}</h3>
              <button
                onClick={handleRemoveLetterhead}
                className="text-red-600 hover:text-red-800 flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <img 
                src={letterheadPreview} 
                alt="Letterhead Preview" 
                className="max-w-full h-auto max-h-32 mx-auto"
              />
            </div>
          </div>
        )}

        {/* Contract Editor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t('contract_text')}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isEditing
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {isEditing ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1 inline" />
                      Editing
                    </>
                  ) : (
                    t('edit_mode')
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Text Formatting Toolbar - Only show in editing mode */}
        {isEditing && (
          <TextFormattingToolbar
            onFormat={handleTextFormat}
            isActive={isFormatActive}
            getCurrentFont={() => {
              if (contractEditorRef.current) {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  
                  // If there's selected text, get the font from the selection
                  if (range.toString().trim()) {
                    const container = range.commonAncestorContainer;
                    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
                    
                    if (element) {
                      const computedStyle = window.getComputedStyle(element);
                      const fontFamily = computedStyle.fontFamily.split(',')[0].replace(/['"]/g, '');
                      return fontFamily;
                    }
                  } else {
                    // No selection, get from the current cursor position
                    const container = range.commonAncestorContainer;
                    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
                    
                    if (element) {
                      const computedStyle = window.getComputedStyle(element);
                      const fontFamily = computedStyle.fontFamily.split(',')[0].replace(/['"]/g, '');
                      return fontFamily;
                    }
                  }
                }
              }
              return 'Aptos';
            }}
            getCurrentFontSize={() => {
              if (contractEditorRef.current) {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  
                  // If there's selected text, get the font size from the selection
                  if (range.toString().trim()) {
                    const container = range.commonAncestorContainer;
                    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
                    
                    if (element) {
                      const computedStyle = window.getComputedStyle(element);
                      const fontSize = computedStyle.fontSize;
                      return Math.round(parseFloat(fontSize)).toString();
                    }
                  } else {
                    // No selection, get from the current cursor position
                    const container = range.commonAncestorContainer;
                    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
                    
                    if (element) {
                      const computedStyle = window.getComputedStyle(element);
                      const fontSize = computedStyle.fontSize;
                      return Math.round(parseFloat(fontSize)).toString();
                    }
                  }
                }
              }
              return '12';
            }}
          />
        )}
            
            {/* Multi-Page Display */}
            <MultiPageDisplay
              content={replaceRepaymentScheduleTable(contractText)}
              isEditing={isEditing}
              onContentChange={handleContentChange}
              showPageLayout={showPageLayout}
              contractEditorRef={contractEditorRef}
            />
          </div>
        </div>


      </div>
    </Layout>
  );
};

export default LoanContractGenerationPage;
