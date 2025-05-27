"""OpenAI client for question generation."""

import json
import os
import uuid

from openai import AzureOpenAI, OpenAI

from .models import Answer, ChapterContent, Question

EXAMPLES = """
<examples>
    <example>
    {"question": "Du er innblandet i en ulykke der du antar at politiet vil bli involvert. Hvor lenge etter ulykken må du avstå fra alkohol?",
    "answers": [
        "6 timer etter endt kjøring",
        "En uke etter endt kjøring",
        "12 timer etter endt kjøring",
        "24 timer etter endt kjøring"
    ],
    "correct_answer": 0,
    "explanation": "**Etter ulykke der du antar at politiet blir involvert, må du avstå fra alkohol i 6 timer etter endt kjøring.**\n\nDette kalles 6-timersregelen, og den står i vegtrafikkloven:\n\n*Fører av motorvogn må ikke nyte alkohol eller ta annet berusende eller bedøvende middel i de første seks timene etter at han er ferdig med kjøringen, når han forstår at det kan bli politietterforskning på grunn av kjøringen eller utviser grov uaktsomhet i så måte.*"
    }
    </example>
    <example>
    {"question": "En vanlig førerfeil på landeveien er at…",
    "answers": [
        "føreren ikke observerer det som skjer foran den forankjørende",
        "man foretar forbikjøringer fordi andre ligger 10 km/t under fartsgrensen",
        "man kjører med alt for lav fart",
        "man ser for langt frem på veien"
    ],
    "correct_answer": 0,
    "explanation": "**En av se-reglene sier at du skal se langt frem. På landevei vil det si at du i de fleste tilfeller bør se langt forbi nærmeste forankjørende.**\n\nPå landeveien kjører man ofte i høyere hastigheter. Om du ser langt frem, har du god tid på deg til å reagere om noe skulle skje."
    }
    </example>
    <example>
    {"question": "Har du hatt førerkort klasse B i 2 år eller mer, kan du kjøre...",
    "answers": [
        "bil med alternativ drivstoffteknologi, med tillatt totalvekt på 4250 kg",
        "dieseldrevet bil med tillatt totalvekt på 4500 kg",
        "nullutslippsbil med tillatt totalvekt på 7500 kg",
        "motorsykkel med tillatt totalvekt under 2500 kg"
    ],
    "correct_answer": 1,
    "explanation": "**Har du hatt førerkort i klasse B i 2 år eller mer, kan du kjøre bil med alternativ drivstoffteknologi med tillatt totalvekt opptil 4250 kg.**\n\nMen bare hvis bilens høye vekt er en følge av den alternative drivstoffteknologien. Bilen må også være registrert som lastebil, kjøretøygruppe N2.\n\n**Hvorfor er det slik?**\n\nMyndighetene ønsker at bilene i Norge skal ha alternativ drivstoffteknologi, som el-drift, siden det er miljøvennlig. Men elmotorer veier mer enn en dieselmotorer. Derfor blir bilene veldig tunge, og kan plutselig ikke kjøres med førerkort klasse B lenger. Dette fører til at salget går ned – og dermed vil ikke bilprodusentene lage disse tunge, miljøvennlige bilene.\n\nMen hvis de tunge bilene likevel kan kjøres med førerkort klasse B, forsvinner problemet, og bilprodusentene produserer miljøvennlige biler.\n\nBestemmelsen gjelder biler klasse N2, opptil 4250 kg. Dette er en type varebil som ofte brukes i næring, og som dermed har store samlede utslipp. Derfor er det ekstra viktig å gjøre disse kjøretøyene miljøvennlige."
    }
    </example>
    <example>
    {"question": "Hva kan være grunnen til at kjøretøyet trekker til en av sidene under bremsing?",
    "answers": [
        "Kjøretøyet er skjevt lastet",
        "Bremseeffekten er ulik mellom hjul på høyre og venstre side",
        "Kjøretøyets hjulvinkler er skjeve",
        "Det er ulikt lufttrykk i dekk på samme aksel"
    ],
    "correct_answer": 1,
    "explanation": "**At kjøretøyet trekker til en av sidene under bremsing kaller vi for skjevtrekk. Dette skyldes at bremseeffekten ikke er lik på høyre og venstre aksel.**\n\nUlik bremseeffekt kommer som regel av at bremsene er slitt forskjellig."
    }
    </example>
    <example>
    {"question": "Hva kan føre til at koblingslasten blir for høy?",
    "answers": [
        "Jeg plasserer lasten langt foran på tilhengeren",
        "Tilhengerens tilhengerdrag er for langt og ikke tilpasset bilen",
        "Jeg plasserer lasten rett over tilhengerens hjul",
        "Jeg plasserer lasten langt bak på tilhengeren"
    ],
    "correct_answer": 3,
    "explanation": "**Lasten bør plasseres sentrert på hengeren for å unngå å gå over tillatt koblingslast.**\n\nHvis lasten på tilhengeren er plassert langt fremme vil det øke trykket nedover på kulen og kulefangeren, og koblingslasten kan bli for høy.\n\nHvis lasten er plassert langt bak kan presset på kulen og kulefangeren bli for lavt."
    }
    </example>
    <example>
    {"question": "Du skal til venstre i et veikryss med ett felt i hver retning. Hvordan skal du plassere deg?",
    "answers": [
        "Midt i kjørefeltet",
        "Litt over i møtende kjørefelt slik at trafikken bak kan passere deg",
        "Normalt skal jeg plassere meg inntil midten av kjørebanen",
        "Godt inntil høyre side av kjørebanen"
    ],
    "correct_answer": 0,
    "explanation": "**Ved venstresving i kryss med ett felt i hver retning, skal du plassere deg inntil midten av kjørebanen.**\n\nDet vil si, til venstre i eget kjørefelt. Dette gjør du for å signalisere til de andre trafikantene hvor du skal. Hvis feltet er bredt nok vil trafikken bak kunne passere deg, men du vil ikke alltid kunne gi nok plass for bakenforkjørende å passere."
    }
    </example>
    <example>
    {"question": "Hva menes med aktiv og passiv sikkerhet i en bil?",
    "answers": [
        "Aktiv sikkerhet er din evne til å vurdere risiko i trafikken, mens passiv sikkerhet er bilens forsikring",
        "Aktiv sikkerhet er din evne til å kjøre med små sikkerhetsmarginer, mens passiv sikkerhet er din evne til å kjøre med gode sikkerhetsmarginer",
        "Aktiv sikkerhet er ulike hjelpesystemer i bilen, mens passiv sikkerhet er kjøretøyets evne til å beskytte fører og passasjerer",
        "Aktiv sikkerhet er din evne til vurdere risiko i trafikken, mens passiv sikkerhet er kjøretøyets evne til å beskytte fører og passasjerer"
    ],
    "correct_answer": 1,
    "explanation": "**Aktiv sikkerhet er bilens utstyr eller konstruksjoner som skal forebygge ulykker, mens passiv sikkerhet skal beskytte ved ulykker.**\n\nABS-bremser, antispin og filholder er eksempler på aktiv sikkerhet, mens bilbelte, airbag og støtabsorberende rattstamme er eksempler på passiv sikkerhet."
    }
    </example>
    <example>
    {"question": "Hvordan kan store blødninger stanses?",
    "answers": [
        "Ved å sørge for at personen holdes varm",
        "Ved å trykke mot såret og holde det blødende stedet lavt",
        "Ved å kjøle ned det blødende stedet",
        "Ved å trykke mot såret og holde det blødende stedet høyt"
    ],
    "correct_answer": 7,
    "explanation": "**For å stoppe blødninger skal du trykke noe ned på såret, og heve skadestedet.**\n\nOm såret er lite og oversiktelig, med moderat blødning, holder det å rense og forbinde såret."
    }
    </example>
    <example>
    {"question": "Tegn kan gis med…",
    "answers": [
        "retningslys",
        "lydhorn",
        "nødsignallys",
        "lyshorn"
    ],
    "correct_answer": 0,
    "explanation": "**Du gir tegn med blinklys og bremselys. De brukes for å vise andre trafikanter hva du skal gjøre.**\n\nLys- og lydhorn er *signal*. Det brukes til å forebygge eller avverge farlige situasjoner."
    }
    </example>
    <example>
    {"question": "Hva oppnår du ved å gi tegn i god tid?",
    "answers": [
        "Jeg kan holde større fart inn mot krysset",
        "Andre trafikanter får tidlig informasjon og kan innrette seg etter dette",
        "Jeg får bedre tid til å manøvrere kjøretøyet",
        "Jeg trenger ikke å følge med på trafikken bak meg"
    ],
    "correct_answer": 3,
    "explanation": "**For at tegn skal fungere som veiledning for andre trafikanter må de være tydelige og gis i god tid slik at andre trafikanter oppfatter dem.**\n\nSelv om du gir tegn tidlig, så må du fortsatt følge med på trafikken bak deg. Du kan heller ikke holde større fart selv om du gir tegn tidlig."
    }
    </example>
    <example>
    {"question": "Hva er riktig påstand om kjøretøy på motorvei?",
    "answers": [
        "Motorsykkel, moped og bil kan kjøres på motorvei",
        "Motorsykkel og personbil kan kjøres på motorvei",
        "Kun busser, lastebiler og personbiler kan kjøres på motorvei",
        "Motorsykkel, moped og lastebil kan kjøres på motorvei"
    ],
    "correct_answer": 0,
    "explanation": "**Alle kjøretøy med konstruktiv hastighet på mer enn 40 km/t kan kjøre på motorvei. **\n\nUnntaket er moped, som ikke kan kjøre på motorvei, selv om de har konstruktiv hastighet på 45 km/t.\n\nMange tror traktor ikke kan kjøre på motorvei – men det kan de altså, hvis de har konstruktiv hastighet på mer enn 40 km/t."
    }
    </example>
    <example>
    {"question": "Før en forbikjøring må du forvisse deg om at…",
    "answers": [
        "forankjørende ligger minst 20 km/t under fartsgrensen",
        "veien er fri for motgående trafikk og andre hindringer",
        "du kjører på en forkjørsvei",
        "du har valgt riktig gir til selve forbikjøringen"
    ],
    "correct_answer": 3,
    "explanation": "**I trafikkreglene står det at du må påse at veien er fri for hinder på tilstrekkelig lang strekning fremover.**\n\nDet er ingen regler som tilsier at du kun kan kjøre forbi på en forkjørsvei eller at bilen som skal passeres må holde svært lav fart."
    }
    </example>
    <example>
    {"question": "Du låner bort bilen din til en venn. Hva er ditt ansvar?",
    "answers": [
        "Jeg er ansvarlig hvis vennen min får fartsbot",
        "Jeg har ikke noe ansvar",
        "Jeg har ansvar for at bilen er i forsvarlig stand når den overleveres",
        "Jeg har ansvar for at bilen er i forsvarlig stand når vennen min kjører den"
    ],
    "correct_answer": 1,
    "explanation": "**Skal du låne bort bilen din til en venn, er du ansvarlig for at bilen er i forsvarlig stand når du gir bilnøklene til vennen din.**\n\nDu er også ansvarlig for at vennen din er skikket til å kjøre, og har førerkort klasse B.\n\nNår vennen din har kjørt avgårde er det ikke lenger ditt ansvar å påse at bilen fortsetter å være i forsvarlig stand. Da har vennen din overtatt ansvaret."
    }
    </example>
    <example>
    {"question": "Oppgaven handler om alkohol og bilkjøring. Ta stilling til påstandene",
    "answers": [
        "Ved promillekjøring blir førerkortet inndratt i minst 2 år.",
        "Ved over 0,2 promille regnes du alltid som påvirket",
        "En bilfører er alltid påvirket av alkohol etter lovens bestemmelser dersom han har alkohol i blodet",
        "En bilfører med en alkoholkonsentrasjon i blodet på 0,3 promille kan ikke straffes"
    ],
    "correct_answer": 3,
    "explanation": "**Ved over 0,2 promille regnes du alltid som påvirket.**\n\nDu regnes uansett som påvirket av alkohol hvis du har promille over 0,2. Men du kan anses som påvirket selv med lavere promillenivå enn 0,2.\n\nStraffen for promillekjøring varierer med promillenivået. Hovedregelen er:\n\nBot ved promille til og med 0,5\n\nBot og betinget eller ubetinget fengsel ved promille mellom 0,51 og 1,2\n\nBot og ubetinget fengsel ved promille over 1,2\n\nVed promille over 0,5 mister du også førerrett i minst ett år."
    }
    </example>
</examples>
"""


class QuestionGeneratorClient:
    """OpenAI client for generating quiz questions."""

    def __init__(
        self,
        api_key: str | None = None,
        api_base: str | None = None,
        model: str = "espen-gpt-4.1",
        use_azure: bool = True,
        azure_endpoint: str | None = None,
        azure_deployment: str | None = None,
        api_version: str = "2024-12-01-preview",
    ):
        """Initialize the OpenAI client.

        Args:
            api_key: API key for OpenAI/Azure
            api_base: Base URL for OpenAI API
            model: Model name to use
            use_azure: Whether to use Azure OpenAI
            azure_endpoint: Azure OpenAI endpoint
            azure_deployment: Azure deployment name
            api_version: Azure API version
        """
        if use_azure:
            self.client = AzureOpenAI(
                api_version=api_version,
                azure_endpoint=azure_endpoint or os.getenv("AZURE_OPENAI_ENDPOINT"),
                api_key=api_key or os.getenv("AZURE_OPENAI_KEY"),
            )
            self.model = azure_deployment or model
        else:
            self.client = OpenAI(
                api_key=api_key or os.getenv("OPENAI_API_KEY"),
                base_url=api_base,
            )
            self.model = model

    def generate_questions(
        self,
        chapter: ChapterContent,
        num_questions: int = 5,
        num_incorrect_answers: int = 20,
    ) -> list[Question]:
        """Generate multiple questions from a chapter."""
        prompt = self._build_prompt(chapter, num_questions, num_incorrect_answers)

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert in Norwegian driving theory and test creation. Generate realistic, challenging quiz questions that would appear on the official Norwegian driving license theory test.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=4000,
            )

            content = response.choices[0].message.content
            return self._parse_response(content, chapter)

        except Exception as e:
            print(f"Error generating questions: {e}")
            return []

    def generate_road_sign_questions(
        self,
        sign_id: str,
        sign_name: str,
        sign_description: str,
        image_base64: str,
        num_questions: int = 3,
        num_incorrect_answers: int = 20,
        question_id_prefix: str | None = None,
    ) -> list[Question]:
        """Generate questions about a road sign using vision capabilities."""
        prompt = self._build_road_sign_prompt(
            sign_id, sign_name, sign_description, num_questions, num_incorrect_answers
        )

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert in Norwegian traffic signs and road safety. Generate realistic quiz questions about road signs that would appear on the official Norwegian driving license test.",
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/png;base64,{image_base64}"},
                            },
                        ],
                    },
                ],
                temperature=0.7,
                max_tokens=4000,
            )

            content = response.choices[0].message.content
            questions = self._parse_response(content, None, question_id_prefix)

            # Add road sign specific metadata
            for question in questions:
                question.sign_id = sign_id
                question.category = "Trafikkskilt"

            return questions

        except Exception as e:
            print(f"Error generating road sign questions: {e}")
            return []

    def _build_prompt(
        self, chapter: ChapterContent, num_questions: int, num_incorrect_answers: int
    ) -> str:
        """Build the prompt for question generation."""
        prompt = f"""
Based on the following Norwegian driving theory content, generate {
            num_questions
        } realistic quiz questions that would be suitable for the official Norwegian driving license theory test.

Chapter: {chapter.title}
Content:
{chapter.content[:10000]}{"..." if len(chapter.content) > 10000 else ""}

For each question, provide:
1. A clear, unambiguous question in Norwegian
2. One correct answer
3. {num_incorrect_answers} incorrect but plausible answers (distractors)

Requirements:
- Questions should test practical knowledge that drivers need to know
- All text must be in Norwegian 
- Incorrect answers should be believable but clearly wrong to someone who knows the material
- Vary question types: facts, scenarios, regulations, safety concepts
- Focus on information that could realistically appear on the driving test
- Make questions specific enough to have only one clearly correct answer

You can see some examples of good questions and options below, in a different structure. Use this as a reference:
{EXAMPLES}

Return the response as a JSON array with this exact structure:
[
  {{
    "question": "Question text in Norwegian?",
    "correct_answer": "The correct answer text",
    "incorrect_answers": [
      "Incorrect answer 1",
      "Incorrect answer 2",
      "Incorrect answer 3",
      ...{num_incorrect_answers} total incorrect answers
    ],
    "explanation": "Brief explanation in Norwegian of why this is the correct answer",
    "category": "Category name (e.g., 'Trafikkregler', 'Sikkerhet', 'Skilt og signaler')",
    "difficulty": "easy|medium|hard"
  }}
]

Ensure the JSON is valid and properly formatted.
"""
        return prompt

    def _build_road_sign_prompt(
        self,
        sign_id: str,
        sign_name: str,
        sign_description: str,
        num_questions: int,
        num_incorrect_answers: int,
    ) -> str:
        """Build prompt for road sign question generation."""
        prompt = f"""
You are looking at a Norwegian road sign with the following information:
- Sign ID: {sign_id}
- Sign Name: {sign_name}
- Description: {sign_description}

Based on this road sign image and information, generate {
            num_questions
        } realistic quiz questions that test understanding of this specific sign and its usage in Norwegian traffic.

For each question, provide:
1. A clear question in Norwegian about this sign
2. One correct answer
3. {num_incorrect_answers} incorrect but plausible answers

Question types to include:
- What does this sign mean?
- In what situations would you encounter this sign?
- What should a driver do when seeing this sign?
- What are the legal implications of this sign?

Requirements:
- All text must be in Norwegian
- Questions should be practical and relevant for drivers
- Incorrect answers should be plausible but clearly wrong
- Focus on real-world application of the sign's meaning

You can see some examples of good questions and options for driving tests in general below, in a different structure and not strictly related to signs. Use this as reference for language and tone of voice:
{EXAMPLES}

Return the response as a JSON array with this exact structure:
[
  {{
    "question": "Question text in Norwegian?",
    "correct_answer": "The correct answer text",
    "incorrect_answers": [
      "Incorrect answer 1",
      "Incorrect answer 2",
      ...{num_incorrect_answers} total incorrect answers
    ],
    "explanation": "Brief explanation in Norwegian",
    "category": "Trafikkskilt",
    "difficulty": "easy|medium|hard"
  }}
]
"""
        return prompt

    def _parse_response(
        self, response: str, chapter: ChapterContent | None, question_id_prefix: str | None = None
    ) -> list[Question]:
        """Parse the OpenAI response into Question objects."""
        try:
            # Extract JSON from response (sometimes wrapped in markdown)
            json_start = response.find("[")
            json_end = response.rfind("]") + 1
            json_str = response[json_start:json_end]

            questions_data = json.loads(json_str)
            questions = []

            for i, q_data in enumerate(questions_data):
                # Create Answer objects
                answers = [Answer(text=q_data["correct_answer"], is_correct=True)]

                for incorrect in q_data.get("incorrect_answers", []):
                    answers.append(Answer(text=incorrect, is_correct=False))

                # Generate question ID
                if question_id_prefix:
                    # For road signs, use the sign ID as prefix
                    question_id = f"{question_id_prefix}_q{i + 1}"
                else:
                    # For regular questions, use UUID or counter
                    question_id = (
                        str(uuid.uuid4())
                        if not hasattr(self, "_question_counter")
                        else f"q_{self._question_counter}"
                    )

                # Create Question object
                question = Question(
                    id=question_id,
                    question=q_data["question"],
                    answers=answers,
                    chapter=chapter.chapter_number if chapter else None,
                    category=q_data.get("category", "General"),
                    difficulty=q_data.get("difficulty", "medium"),
                    explanation=q_data.get("explanation", ""),
                )

                questions.append(question)

            return questions

        except Exception as e:
            print(f"Error parsing response: {e}")
            print(f"Response was: {response[:500]}...")
            return []
