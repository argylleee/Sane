// OWNER: model (reference data). One short explainer per scam archetype, shown on the Learn page
// and under a result that matched the pattern. Hand-written, original, no model output.
// Filipino and Taglish lines are awaiting native-speaker review (docs/planning/filipino-review-*.md).
import type { Lang } from '../types';

type Localized = Record<Lang, string>;
export type ScamType = { tell: Localized; doThis: Localized };

export const SCAM_TYPES: Record<string, ScamType> = {
  gcash_lockout: {
    tell: {
      en: 'Says your wallet is locked or limited, and asks you to "verify" on a link.',
      fil: 'Sinasabing naka-lock o limitado ang wallet mo, at pinapa-"verify" sa isang link.',
      taglish: 'Sinasabing naka-lock o limited ang wallet mo, at pinapa-"verify" sa isang link.',
    },
    doThis: {
      en: 'Open the app yourself. Real wallets never ask for your MPIN or OTP by message.',
      fil: 'Buksan mo mismo ang app. Hindi humihingi ng MPIN o OTP sa mensahe ang tunay na wallet.',
      taglish:
        'I-open mo mismo ang app. Hindi humihingi ng MPIN o OTP sa message ang real na wallet.',
    },
  },
  otp_request: {
    tell: {
      en: 'Asks you to send or read out a one-time code, PIN or password.',
      fil: 'Hinihingi na ipadala o basahin mo ang one-time code, PIN o password.',
      taglish: 'Hinihingi na i-send o basahin mo ang one-time code, PIN o password.',
    },
    doThis: {
      en: 'Never share a code with anyone. The code is the key to your money.',
      fil: 'Huwag magbigay ng code kanino man. Ang code ang susi ng pera mo.',
      taglish: 'Huwag mag-share ng code kahit kanino. Ang code ang key ng pera mo.',
    },
  },
  task_job_scam: {
    tell: {
      en: 'Offers easy pay for liking, rating or finishing small tasks, then asks you to top up first.',
      fil: 'Nag-aalok ng madaling kita sa pag-like, pag-rate o maliliit na task, tapos pinagpapa-top up ka muna.',
      taglish:
        'Nag-aalok ng easy income sa pag-like, pag-rate o small tasks, tapos pinapag-top up ka muna.',
    },
    doThis: {
      en: 'A real job never makes you pay to start or to get your pay. Stop and block.',
      fil: 'Hindi pinagbabayad ang tunay na trabaho para magsimula o makuha ang sahod. Huminto at i-block.',
      taglish:
        'Hindi pinagbabayad ang real na job para magsimula o makuha ang sahod. Stop at i-block.',
    },
  },
  parcel_fee: {
    tell: {
      en: 'A parcel is "held" and you must pay a small fee through a link before delivery.',
      fil: 'May parcel daw na "naka-hold" at kailangan mong magbayad ng maliit na fee sa link bago i-deliver.',
      taglish:
        'May parcel daw na "naka-hold" at kailangan mong mag-pay ng small fee sa link bago i-deliver.',
    },
    doThis: {
      en: 'Check the order in the shop or courier app. Do not pay through a message link.',
      fil: 'Tingnan ang order sa shop o courier app. Huwag magbayad sa link ng mensahe.',
      taglish: 'I-check ang order sa shop o courier app. Huwag mag-pay sa link ng message.',
    },
  },
  prize_promo: {
    tell: {
      en: 'You "won" a prize you never entered for, but must pay a tax or fee to claim it.',
      fil: '"Nanalo" ka raw ng premyong hindi mo sinalihan, pero magbabayad ka muna ng buwis o fee.',
      taglish: '"Nanalo" ka raw ng prize na hindi mo sinalihan, pero mag-pay ka muna ng tax o fee.',
    },
    doThis: {
      en: 'You cannot win a contest you did not join. Real prizes do not charge a claim fee.',
      fil: 'Hindi ka mananalo sa contest na hindi mo sinalihan. Walang claim fee ang tunay na premyo.',
      taglish:
        'Hindi ka mananalo sa contest na hindi mo sinalihan. Walang claim fee ang real na prize.',
    },
  },
  online_casino_bonus: {
    tell: {
      en: 'Free spins, a bonus or a "lucky" invite to an online casino site.',
      fil: 'Libreng spin, bonus o "suwerte" na imbitasyon sa isang online casino site.',
      taglish: 'Free spins, bonus o "lucky" invite sa isang online casino site.',
    },
    doThis: {
      en: 'Do not open the link or deposit. These sites are built to take your money.',
      fil: 'Huwag buksan ang link o mag-deposit. Ginawa ang mga site na ito para kunin ang pera mo.',
      taglish:
        'Huwag i-open ang link o mag-deposit. Ginawa ang sites na ito para kunin ang pera mo.',
    },
  },
  relative_emergency: {
    tell: {
      en: 'Someone claims to be a relative with a new number and needs money fast.',
      fil: 'May nagpapakilalang kamag-anak na may bagong number at kailangan agad ng pera.',
      taglish: 'May nagpapakilalang relative na may bagong number at kailangan agad ng pera.',
    },
    doThis: {
      en: 'Call your relative on the number you already have, or ask a family member, before sending anything.',
      fil: 'Tawagan ang kamag-anak sa number na hawak mo na, o magtanong sa pamilya, bago magpadala.',
      taglish:
        'Tawagan ang relative sa number na hawak mo na, o magtanong sa family, bago mag-send.',
    },
  },
  loan_app_threat: {
    tell: {
      en: 'Threatens to shame you or message your contacts over a loan, with a short deadline.',
      fil: 'Binabantaang ipapahiya ka o i-message ang mga contact mo dahil sa utang, may maikling deadline.',
      taglish:
        'Binabantaang ipapahiya ka o i-message ang contacts mo dahil sa utang, may short deadline.',
    },
    doThis: {
      en: 'Do not panic-pay. Keep screenshots and report the lender; harassment is not allowed.',
      fil: 'Huwag magbayad dahil sa takot. Itago ang screenshots at i-report ang nagpapautang; bawal ang panliligalig.',
      taglish:
        'Huwag mag-pay dahil sa takot. I-save ang screenshots at i-report ang lender; bawal ang harassment.',
    },
  },
  fake_bank_alert: {
    tell: {
      en: 'A "bank" says there is a suspicious charge and asks you to log in or call a number in the message.',
      fil: 'May "bangko" na nagsasabing may kahina-hinalang charge at pinapa-log in o tawagan ang numero sa mensahe.',
      taglish:
        'May "bank" na nagsasabing may suspicious charge at pinapa-log in o tawagan ang number sa message.',
    },
    doThis: {
      en: 'Use the number on the back of your card or open your bank app yourself.',
      fil: 'Gamitin ang numero sa likod ng card o buksan mo mismo ang bank app.',
      taglish: 'Gamitin ang number sa likod ng card o i-open mo mismo ang bank app.',
    },
  },
  gov_benefit: {
    tell: {
      en: 'Claims to be an agency with a benefit to claim or a fine to pay, through a link.',
      fil: 'Nagpapakilalang ahensya na may benepisyong kukunin o multang babayaran, sa pamamagitan ng link.',
      taglish:
        'Nagpapakilalang agency na may benefit na kukunin o fine na babayaran, sa pamamagitan ng link.',
    },
    doThis: {
      en: 'Real agencies use addresses ending in .gov.ph. Type the address yourself.',
      fil: 'Ang tunay na ahensya ay may address na nagtatapos sa .gov.ph. Ikaw mismo ang mag-type.',
      taglish:
        'Ang real na agency ay may address na nagtatapos sa .gov.ph. Ikaw mismo ang mag-type.',
    },
  },
  utility_disconnect: {
    tell: {
      en: 'Says your power or water will be cut tonight unless you pay or call right now.',
      fil: 'Sinasabing puputulan ng kuryente o tubig ngayong gabi kung hindi ka magbabayad o tatawag agad.',
      taglish:
        'Sinasabing puputulan ng kuryente o tubig ngayong gabi kung hindi ka mag-pay o tatawag agad.',
    },
    doThis: {
      en: "Check your bill or the utility's official app. Real notices do not demand payment by chat.",
      fil: 'Tingnan ang bill o ang opisyal na app ng utility. Hindi naniningil sa chat ang tunay na abiso.',
      taglish:
        'I-check ang bill o ang official app ng utility. Hindi naniningil sa chat ang real na notice.',
    },
  },
  investment_crypto: {
    tell: {
      en: 'Promises big, guaranteed returns with little risk, often with pressure to join today.',
      fil: 'Nangangako ng malaki at garantisadong tubo na halos walang risk, madalas minamadali kang sumali ngayon.',
      taglish:
        'Nangangako ng big at guaranteed returns na halos walang risk, madalas minamadali kang sumali ngayon.',
    },
    doThis: {
      en: 'No honest investment guarantees profit. Check the company with the SEC before paying.',
      fil: 'Walang tapat na investment na nag-gagarantiya ng tubo. Suriin ang kumpanya sa SEC bago magbayad.',
      taglish:
        'Walang honest na investment na nag-gu-guarantee ng profit. I-check ang company sa SEC bago mag-pay.',
    },
  },
  romance_giftparcel: {
    tell: {
      en: 'Someone you only know online sends a "gift" but you must pay customs or a release fee.',
      fil: 'May kakilala mo lang online na nagpadala ng "regalo" pero magbabayad ka ng customs o release fee.',
      taglish:
        'May kakilala mo lang online na nag-send ng "gift" pero mag-pay ka ng customs o release fee.',
    },
    doThis: {
      en: 'Stop sending money to someone you have not met. Talk to a trusted person first.',
      fil: 'Itigil ang pagpapadala ng pera sa taong hindi mo pa nakikilala nang personal. Kausapin muna ang pinagkakatiwalaan mo.',
      taglish:
        'Itigil ang pag-send ng pera sa taong hindi mo pa nakikilala in person. Kausapin muna ang trusted person mo.',
    },
  },
  reward_points_expiry: {
    tell: {
      en: 'Your points or rewards "expire today" and you must redeem them through a link.',
      fil: 'Mag-e-expire na raw "ngayon" ang points o rewards mo at kailangan mong i-redeem sa link.',
      taglish:
        'Mag-e-expire na raw "today" ang points o rewards mo at kailangan mong i-redeem sa link.',
    },
    doThis: {
      en: 'Check your points inside the official app. Do not log in through a message link.',
      fil: 'Tingnan ang points sa loob ng opisyal na app. Huwag mag-log in sa link ng mensahe.',
      taglish: 'I-check ang points sa loob ng official app. Huwag mag-log in sa link ng message.',
    },
  },
  marketplace_deposit: {
    tell: {
      en: 'A seller or buyer wants a deposit or "reservation fee" before you can see or get the item.',
      fil: 'Gusto ng nagbebenta o bumibili ng deposito o "reservation fee" bago mo makita o makuha ang item.',
      taglish:
        'Gusto ng seller o buyer ng deposit o "reservation fee" bago mo makita o makuha ang item.',
    },
    doThis: {
      en: "Meet in a public place and pay on hand-over. Use the platform's own payment and chat.",
      fil: 'Magkita sa pampublikong lugar at magbayad sa abutan. Gamitin ang sariling payment at chat ng platform.',
      taglish:
        'Mag-meet sa public place at mag-pay sa hand-over. Gamitin ang payment at chat ng platform mismo.',
    },
  },
  advance_fee_release: {
    tell: {
      en: 'You are told money or a loan is ready, but you must pay a fee first to release it.',
      fil: 'Sinabihan kang handa na ang pera o pautang, pero magbabayad ka muna ng fee para ma-release.',
      taglish:
        'Sinabihan kang ready na ang pera o loan, pero mag-pay ka muna ng fee para ma-release.',
    },
    doThis: {
      en: 'Real lenders take fees from the loan, not before it. Do not pay to receive money.',
      fil: 'Kinukuha ng tunay na nagpapautang ang fee mula sa loan, hindi bago ito. Huwag magbayad para makatanggap ng pera.',
      taglish:
        'Kinukuha ng real na lender ang fee mula sa loan, hindi bago ito. Huwag mag-pay para makatanggap ng pera.',
    },
  },
};
