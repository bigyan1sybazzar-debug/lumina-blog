import base64
import os

b64_data = "iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAe1BMVEX////78vL45ufrlZvbACPcFDLcFTLbACLdK0LdLkTdKEDcJD745OX45+jcHTriYmzngYLbESngTVz21tfdJzPjdX/ur7LcGTbqmqD++fnYAAD33uDvt7voiIvbISrhW1/dMjr1ztLdNUvfRFbso6Tng4vhWWTmfH7lc3pUlbFDAAAApklEQVR4AbWSAw7AAAxFO9u2cf8Tzu4W7oU/NeBPCPIGATsUzbAXGI7a42heuMNtsSQ7a1EaEVcjI8OCMhtVTR/RDB4xiuYiLJt/GlUHFlwPN/qSE4wKN1JcqED0Ehk7MUCivteMUty4kkl4Q3meABQe3hAjSQqQJY9GllU9rgGPXGieRrFaRFAzyOKlthvpS2NdPHIyib+djOA+jj3uFH+T7wf7hwE23xD0wroPdwAAAABJRU5ErkJggg=="
image_data = base64.b64decode(b64_data)

public_dir = r"c:\Users\BIggsdesign1\Desktop\lumina-blog\public"

# Save as icon.png
with open(os.path.join(public_dir, "icon-32x32.png"), "wb") as f:
    f.write(image_data)

# Save as apple-icon.png
with open(os.path.join(public_dir, "apple-icon.png"), "wb") as f:
    f.write(image_data)

# Save as favicon.ico (simple rename for now, normally ICO is a different format but browsers accept PNG)
with open(os.path.join(public_dir, "favicon.ico"), "wb") as f:
    f.write(image_data)

print("Icons generated successfully.")
