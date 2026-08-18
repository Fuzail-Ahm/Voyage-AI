from services.pdf_generator import generate_trip_pdf


def pdf_node(state: dict):
    """
    Generate the final travel-plan PDF from the completed graph state.
    """

    pdf_path = generate_trip_pdf(state)

    return {
        "pdf_path": pdf_path
    }